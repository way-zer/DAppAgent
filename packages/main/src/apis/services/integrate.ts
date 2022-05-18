import {ExposedService, useService} from '/@/apis/services/_define';
import {App, AppMeta} from '/@/core/apps';
import {CoreIPFS} from '/@/core/ipfs';
import Boom from '@hapi/boom';
import {UserManager} from '/@/core/users';
import {bases, codecs} from 'multiformats/basics';
import PeerId from 'peer-id';
import config from '/@/config';
import {sleep} from '/@/util';

const encoding = bases.base64pad;
const appRecordTag = 'dappAgent.appRecord';

function dagCodec() {
    return CoreIPFS.inst.codecs.getCodec('dag-cbor');
}

interface Signed {
    key: string; //encoded public key marshal
    sign: string; //encoded sign
}

async function sign(key: PeerId, data: Uint8Array) {
    let sign = await key.privKey.sign(data);
    return {
        key: encoding.encode(key.pubKey.marshal()),
        sign: encoding.encode(sign),
    };
}

async function checkSign(data: Uint8Array, obj: Signed, id?: string) {
    let key = await PeerId.createFromPubKey(obj.key);
    if (id && key.toB58String() != id) return false;
    return key.pubKey.verify(data, encoding.decode(obj.sign));
}

export class IntegrateApi extends ExposedService {
    // /**
    //  * 通过第三方进行实名认证
    //  * @return string 认证签名
    //  */
    // async userVerify(user: User): Promise<string> {
    //   /*TODO
    //   通过self密钥,生成持有签名
    //   将公钥(地址)及持有签名一起传递到第三方,获取认证签名
    //    */
    //   return MOCK_Verify_Sign;
    //   }
    //
    //   /** 验证实名签名是否有效 */
    //   async userVerifyOK(user: User, sign: string): Promise<boolean> {
    //       //TODO 通过第三方公钥验证签名是否正确
    //     return sign == MOCK_Verify_Sign;
    //   }
    async appRecord(app: App): Promise<string> {
        const meta = await app.appMeta.get();
        delete meta.recordSign;
        const metaHash = (await CoreIPFS.inst.dag.put(meta, {onlyHash: true}));
        return new Promise(async resolve => {
            await CoreIPFS.inst.pubsub.subscribe(appRecordTag + '|' + metaHash.toString(), async (result) => {
                let obj = (await dagCodec()).decode(result.data);
                await CoreIPFS.inst.pubsub.unsubscribe(appRecordTag + '|' + metaHash.toString());
                if (obj.ok && await checkSign(metaHash.bytes, {sign: obj.sign, key: config.app.integrate.publicKey}))
                    return resolve(obj.sign);
                throw Boom.notAcceptable('Fail to get app Sign', {app: app.id.toString(), result: obj});
            });
            await CoreIPFS.inst.pubsub.publish(appRecordTag, (await dagCodec()).encode({
                meta, metaHash,
                appSign: await sign((await app.privateKey())!!, metaHash.bytes),
                userSign: await sign(UserManager.self().id, metaHash.bytes),
            }));
            await sleep(30_000);
            await CoreIPFS.inst.pubsub.unsubscribe(appRecordTag + '|' + metaHash.toString());
            throw Boom.gatewayTimeout();
        });
    }

    async appRecordOK(app: App, sign: string): Promise<boolean> {
        if (!config.app.integrate.publicKey) return true;

        const meta = await app.appMeta.get();
        delete meta.recordSign;
        const metaHash = (await CoreIPFS.inst.dag.put(meta, {onlyHash: true}));

        return checkSign(metaHash.bytes, {
            sign, key: config.app.integrate.publicKey,
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
        if (config.app.integrate.privateKey)
            setTimeout(async () => {
                while (CoreIPFS.instUnsafe == null)
                    await sleep(100);
                const key = await PeerId.createFromPrivKey(config.app.integrate.privateKey!!);
                const codec = await dagCodec();
                await CoreIPFS.inst.pubsub.subscribe(appRecordTag, async (msg) => {
                    let obj = codec.decode(msg.data);
                    let hash = obj.metaHash;
                    if (!hash) return;

                    async function handle() {
                        let meta = obj.meta as AppMeta;
                        const metaHash = (await CoreIPFS.inst.dag.put(meta, {onlyHash: true}));
                        if (metaHash != hash) return {error: 'Inconsistent metaHash'};
                        if (!await checkSign(hash.bytes, obj.appSign, meta.id)) return {error: 'Fail to check appSign'};
                        if (!await checkSign(hash.bytes, obj.userSign, meta.creator)) return {error: 'Fail to check userSign'};
                        //TODO check user verify
                        return {ok: true, sign: await sign(key, hash.bytes)};
                    }

                    await CoreIPFS.inst.pubsub.publish(appRecordTag + '|' + hash.toString(), codec.encode(await handle()));
                    console.log('Handled appRecord for ', hash);
                });
                console.log('Integrate master works');
            });
    }
}
