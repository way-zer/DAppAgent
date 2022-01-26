import {DagConfigFile, IPFSFile, JsonConfigFile} from '/@/util/ipfsFile';
import {AppLocalMeta, AppMeta, ProgramMeta} from '/@/core/apps/define';
import {keys, PrivateKey} from 'libp2p-crypto';
import toBuffer from 'it-to-buffer';
import {CID} from 'multiformats';
import {DBManager, DBStore} from '/@/core/db';
import Boom, {badData, notFound} from '@hapi/boom';
import {normalizePath} from 'vite';
import {CoreIPFS} from '/@/core/ipfs';
import parseDuration from 'parse-duration';
import {AppId} from '/@/core/apps/appId';
import PeerId from 'peer-id';

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
  }

  async getFile(path: string) {
    return await new IPFSFile(this.programRoot + path).read();
  }

  //private app
  async canModify() {
    return await this.privateKeyFile.exists();
  }

  async privateKey(): Promise<PrivateKey | null> {
    try {
      let bs = await toBuffer(await this.privateKeyFile.read());
      return await keys.unmarshalPrivateKey(bs);
    } catch (e) {
      return null;
    }
  }

  async publicIds(): Promise<AppId[]> {
    if (!await this.canModify()) return [];
    const ipnsId = await PeerId.createFromPrivKey((await this.privateKey())!!.bytes);
    return [
      new AppId('ipns', ipnsId.toB58String()),
      new AppId('ipfs', (await this.appMeta.file.cid()).toString()),
    ];
  }

  async publishIPNS() {
    if (!(await this.appMeta.get()).recordSign) return;
    let value: any = await this.appMeta.file.cid();
    value = new TextEncoder().encode(normalizePath(value as any));
    const {name} = await CoreIPFS.inst.ipns.publish((await this.privateKey())!!, value, parseDuration(''));
    console.log(`publish App ${this.id.toString()} to /ipns/${name}`);
  }

  //permission
  async hasPermission(permission: string) {
    if (permission ! in (await this.programMeta.get()).permissions.map(it => it.node)) return false;
    return (await this.localData.get()).permissions[permission]?.granted || false;
  }

  async grantPermission(permission: string) {
    if (permission ! in (await this.programMeta.get()).permissions.map(it => it.node)) return false;
    const data = await this.localData.get();
    data.permissions[permission] = {granted: true, time: new Date()};
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
  async getService(name: string): Promise<string> {
    const {services} = await this.programMeta.get();
    if (!services || !services[name])
      throw Boom.notFound('Not found service ' + name, {app: this.id, name, services});
    return this.id.url + services[name];
  }
}

