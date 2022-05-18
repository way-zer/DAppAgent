import {api, ExposedService, useService} from '/@/apis/services/_define';
import {App, AppMeta} from '/@/core/apps';
import {CoreIPFS} from '/@/core/ipfs';
import Boom from '@hapi/boom';
import {User, UserManager} from '/@/core/users';
import {bases} from 'multiformats/basics';
import PeerId from 'peer-id';
import config from '/@/config';
import {fromString as uint8ArrayFromString} from 'uint8arrays/from-string';
import axios from 'axios';
import {BlockCodec} from 'multiformats/types/src/codecs/interface';
import {CID} from 'multiformats';
import {dagCodec, dagHash} from '/@/util/dag';
import {sleep} from '/@/util/async';

const encoding = bases.base64pad;
const appRecordTag = 'dappAgent.appRecord';
const userVerifyTag = 'dappAgent.userVerify';

interface Signed {
    key: string; //encoded public key marshal
    sign: string; //encoded sign
}

async function sign(key: PeerId, data: Uint8Array): Promise<Signed> {
    return {
        key: key.toJSON().pubKey!!,
        sign: encoding.encode(await key.privKey.sign(data)),
    };
}

async function checkSign(data: Uint8Array, obj: Signed, id?: string) {
    let key = await PeerId.createFromPubKey(obj.key);
    if (id && key.toB58String() != id) return false;
    return key.pubKey.verify(data, encoding.decode(obj.sign));
}

interface Msg {
    userId: string//base56BTC
    hash: CID,
    sign: Signed,
    payload: any
}

async function msgCodec() {
    return await dagCodec() as BlockCodec<any, Msg>;
}

export class IntegrateApi extends ExposedService {
    /**
     * 通过第三方进行实名认证
     * @return string 认证签名
     */
    @api()
    async requestVerified() {
        if (await UserManager.verify()) return;
        const user = UserManager.self();
        const sign = await this.userVerify(user);
        await user.metadataFile.set({verifySign: sign});
        user.publishMetadata().then();
    }

    /**
     * @internal 内部接口
     * 生成一堆供使用的密钥对
     */
    @api()
    async _generateKeyPair() {
        return await PeerId.create({keyType: 'Ed25519', bits: 384});
    }

    /**
     * 通过第三方进行实名认证
     * @return string 认证签名
     */
    async userVerify(user: User): Promise<string> {
        //进行前端OAuth登录
        const {code, error} = await useService('call').request('sys:admin', 'verify', {
            url: config.app.integrate.oAuth.authUrl,
        });
        if (!code || error)
            throw Boom.notAcceptable('Oauth login fail: ' + error);


        //发送到权威节点进行验证和签名
        const result = await this.sendToAuthNode(userVerifyTag, user.id, {
            code,
        });
        if (result.ok && await this.userVerifyOK(user, result.sign)) {
            return result.sign;
        }
        throw Boom.notAcceptable('Fail to get verify Sign', {result});
    }

    /** 验证实名签名是否有效 */
    async userVerifyOK(user: User, sign: string): Promise<boolean> {
        return IntegrateApi._userVerifyOK(user.id.toB58String(), sign);
    }

    private static async _userVerifyOK(userId: string, sign: string) {
        return await checkSign(uint8ArrayFromString(userId + '@' + config.app.integrate.oAuth.id), {
            sign, key: config.app.integrate.publicKey!!,
        });
    }

    async appRecord(app: App): Promise<string> {
        if (!config.app.integrate.publicKey) throw Boom.notImplemented('No integrate.publicKey found');
        await this.requestVerified();
        const user = UserManager.self();

        const meta = await app.appMeta.get();
        delete meta.recordSign;
        const metaHash = await dagHash(meta);

        const result = await this.sendToAuthNode(appRecordTag, user.id, {
            meta, metaHash,
            appSign: await sign((await app.privateKey())!!, metaHash.bytes),
            userVerifySign: (await user.metadataFile.get()).verifySign,
        });
        if (result.ok && await this.appRecordOK(app, result.sign))
            return result.sign;
        throw Boom.notAcceptable('Fail to get app Sign', {app: app.id.toString(), result});
    }

    async appRecordOK(app: App, sign: string): Promise<boolean> {
        if (!config.app.integrate.publicKey) return true;

        const meta = await app.appMeta.get();
        delete meta.recordSign;
        const metaHash = await dagHash(meta);

        return checkSign(metaHash.bytes, {
            sign, key: config.app.integrate.publicKey,
        });
    }

    private async sendToAuthNode(tag: string, user: PeerId, obj: object): Promise<any> {
        const hash = await dagHash(obj);
        const id = hash.toString();
        const sign0 = await sign(user, hash.bytes);
        return new Promise(async (resolve, reject) => {
            await CoreIPFS.inst.pubsub.subscribe(tag + '|' + id, async (result) => {
                let obj = (await dagCodec()).decode(result.data);
                await CoreIPFS.inst.pubsub.unsubscribe(tag + '|' + id);
                resolve(obj);
            });
            await CoreIPFS.inst.pubsub.publish(tag, (await msgCodec()).encode({
                userId: user.toB58String(), hash, sign: sign0, payload: obj,
            }));
            await sleep(30_000);
            await CoreIPFS.inst.pubsub.unsubscribe(tag + '|' + id);
            reject(Boom.gatewayTimeout('Timeout sendToAuthNode'));
        });
    }

    constructor() {
        super();
        App.verifier = async (app: App) => {
            if (app.id.type === 'dev' || app.id.type === 'sys') return true;
            const sign = (await app.appMeta.get()).recordSign;
            if (!sign) return false;
            return this.appRecordOK(app, sign);
        };
        UserManager.verifier = async (user: User) => {
            try {
                const sign = (await user.metadataFile.get()).verifySign;
                if (!sign) return false;
                return this.userVerifyOK(user, sign);
            } catch {
                return false;
            }
        };
        //权威节点验证及签名功能实现
        // TODO 在websocket功能完成后，可以考虑移出主应用
        if (config.app.integrate.privateKey)
            setTimeout(async () => {
                while (CoreIPFS.instUnsafe == null)
                    await sleep(100);
                const key = await PeerId.createFromPrivKey(config.app.integrate.privateKey!!);
                const codec = await dagCodec();

                async function registerReceiveHandler(tag: string, handle: (msg: Msg) => Promise<object>) {
                    await CoreIPFS.inst.pubsub.subscribe(tag, async (msg: { data: Uint8Array }) => {
                        const msg0 = codec.decode(msg.data) as Msg;
                        let {hash, sign, userId, payload} = msg0;
                        if (!hash || !sign) return;

                        async function handle0() {
                            const hashCheck = await dagHash(payload);
                            if (!hashCheck.equals(hash)) return {error: 'Inconsistent hash'};
                            if (!await checkSign(hash.bytes, sign, userId)) return {error: 'Fail to check sign'};
                            return await handle(msg0);
                        }

                        await CoreIPFS.inst.pubsub.publish(tag + '|' + hash.toString(), codec.encode(await handle0()));
                    });
                }

                await registerReceiveHandler(userVerifyTag, async (msg) => {
                    console.log('Handle userVerify for ', msg.userId);

                    let accessToken;
                    try {
                        await axios.post(config.app.integrate.oAuth.verifyUrl + '&code=' + encodeURI(msg.payload.code), null, {
                            headers: {
                                accept: 'application/json',
                            },
                        }).then(it => accessToken = it.data['access_token']);
                    } catch (e) {
                        return {error: 'Fail to get accessToken: ' + e};
                    }

                    //TODO 通过accessToken获取信息,并储存到数据库
                    return {
                        ok: true,
                        sign: (await sign(key, uint8ArrayFromString(msg.userId + '@' + config.app.integrate.oAuth.id))).sign,
                    };
                });
                await registerReceiveHandler(appRecordTag, async (msg) => {
                    let meta = msg.payload.meta as AppMeta;
                    const metaHash = msg.payload.metaHash as CID;
                    if (!meta || !metaHash) return {error: 'require app meta'};
                    console.log('Handle appRecord for ', meta.id, metaHash.toString());

                    const metaHashCheck = await dagHash(meta);
                    if (!metaHashCheck.equals(metaHash)) return {error: 'Inconsistent metaHash'};
                    if (meta.creator != msg.userId) return {error: 'Fail to check meta.creator'};
                    if (!await checkSign(metaHash.bytes, msg.payload.appSign, meta.id)) return {error: 'Fail to check appSign'};
                    if (!await IntegrateApi._userVerifyOK(msg.userId, msg.payload.userVerifySign)) return {error: 'Fail to check userVerifySign'};
                    //TODO 储存信息到数据库
                    return {ok: true, sign: (await sign(key, metaHash.bytes)).sign};
                });
                console.log('Integrate master works');
            });
    }
}
