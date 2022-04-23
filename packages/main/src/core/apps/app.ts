import {DagConfigFile, IPFSFile, JsonConfigFile} from '/@/util/ipfsFile';
import {AppLocalMeta, AppMeta, ProgramMeta} from '/@/core/apps/define';
import toBuffer from 'it-to-buffer';
import {CID} from 'multiformats';
import {DBManager, DBStore} from '/@/core/db';
import Boom, {badData, notFound} from '@hapi/boom';
import {CoreIPFS} from '/@/core/ipfs';
import {AppId} from '/@/core/apps/appId';
import PeerId from 'peer-id';
import {bases} from 'multiformats/basics';

export class App {
    static verifier: (app: App) => Promise<boolean> = async () => true;
    readonly appRoot: string;
    readonly appMeta: DagConfigFile<AppMeta>;
    readonly localData: DagConfigFile<AppLocalMeta>;
    readonly privateKeyFile: IPFSFile;

    constructor(public readonly id: AppId) {
        this.appRoot = '/apps/' + this.id.toString();
        this.appMeta = new IPFSFile(this.appRoot + '/meta').asDagConfig<AppMeta>();
        this.localData = new IPFSFile(this.appRoot + '/local').asDagConfig<AppLocalMeta>();
        this.privateKeyFile = new IPFSFile(this.appRoot + '/key');
    }

    async verify(): Promise<boolean> {
        return App.verifier(this);
    }

    //All Api Behind need loadProgram

    programCID!: CID;
    programRoot!: string;
    programMeta!: JsonConfigFile<ProgramMeta>;

    async loadProgram(force = false) {
        if (!force && this.programRoot) return;
        this.programCID = (await this.appMeta.get()).program;
        this.programRoot = '/ipfs/' + this.programCID;
        this.programMeta = new IPFSFile(this.programRoot + '/app.json').asJsonConfig<ProgramMeta>();
        await this.localData.edit({lastUse: Date.now()});
    }

    async getFile(path: string) {
        return await new IPFSFile(this.programRoot + path).read();
    }

    //private app
    async canModify() {
        return await this.privateKeyFile.exists();
    }

    async privateKey(): Promise<PeerId | null> {
        try {
            let bs = await toBuffer(await this.privateKeyFile.read());
            return await PeerId.createFromProtobuf(bs);
        } catch (e) {
            return null;
        }
    }

    async publicIds(): Promise<AppId[]> {
        if (!await this.canModify()) return [];
        const ipnsId = (await this.privateKey())!!;
        return [
            new AppId('ipns', bases.base32.encode(ipnsId.toBytes())),
            new AppId('ipfs', (await this.appMeta.file.cid()).toString()),
        ];
    }

    async publishIPNS() {
        if (!(await this.appMeta.get()).recordSign) return;
        const cid = await this.appMeta.file.cid();
        const {ipns} = await CoreIPFS.publishIPNS((await this.privateKey())!!, cid);
        console.log(`publish App ${this.id.toString()} to ${ipns}`);
    }

    //permission
    async hasPermission(permission: string) {
        if (this.id.type == 'sys') return true;
        if (!(await this.programMeta.get()).permissions.some(it => it.node === permission)) return false;
        return (await this.localData.get()).permissions[permission]?.granted || false;
    }

    async grantPermission(permission: string) {
        if (!(await this.programMeta.get()).permissions.some(it => it.node === permission)) return false;
        const data = await this.localData.get();
        data.permissions[permission] = {granted: true, time: Date.now()};
        await this.localData.set(data);
        return true;
    }

    //database
    async getDataBase(name: string): Promise<DBStore> {
        const define = (await this.programMeta.get()).databases.find(it => it.name == name);
        if (!define) throw notFound('App\'s database not define.' + name, {app: this.id, name});
        const addr = (await this.appMeta.get()).databases[name];
        if (!addr) throw badData('database addr not found', {app: this.id, db: define});
        return DBManager.getDataBase({...define, addr});
    }

    //service
    async getService(name: string): Promise<{ url: string, background: boolean }> {
        // return {url: 'http://localhost:3000/permission', background: false};
        const {services} = await this.programMeta.get();
        if (!services || !services[name])
            throw Boom.notFound('Not found service ' + name, {app: this.id, name, services});
        const service = services[name];
        return {
            url: this.id.url + service.url,
            background: !!service.background,
        };
    }
}

