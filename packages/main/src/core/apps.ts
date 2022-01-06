import {CoreIPFS} from './ipfs';
import {decodeText, peerIdBase32} from '../util';
import Boom, {conflict, forbidden, notFound} from '@hapi/boom';
import {CID} from 'multiformats';
import type {DataBase, DBStore} from './db';
import {DBManager} from './db';
import memoizee from 'memoizee';
import last from 'it-last';
import {keys, PrivateKey} from 'libp2p-crypto';

export interface AppDesc {
  title: string,
  desc: string,
  author: string,
  icon: string,
  tags: string[],
  links: Record<string, string>,
}

export interface AppMetadata {
  recordSign?: string;
  permissions: string[];
  databases: DataBase[];
  desc: Partial<AppDesc>;//may not full
  services: Record<string, string>;
}

export class AppId {
  constructor(public readonly type: string, public readonly name: string) {
    this.name = name.toLowerCase();
  }

  toString() {
    return `${this.type}:${this.name}`;
  }

  get url() {
    return `dapp://${this.name}.${this.type}`;
  }

  permissionNode(permission: string) {
    return `dapp.permissions.${this.type}-${this.name}.${permission}`;
  }

  static fromString(id: string) {
    const [type, name] = id.split(':');
    return new AppId(type, name);
  }
}

export abstract class App {
  static verifier: (app: App) => Promise<boolean> = async () => true;

  /**
   * @param id like dev:test ipfs:xxx
   * @param addr /ipns/ for prod or ipfs for dev
   */
  protected constructor(
    public readonly id: AppId,
    public readonly addr: string,
  ) {
  }

  isProd() {
    return this.addr.startsWith('/ipns/');
  }

  async verify(): Promise<boolean> {
    return App.verifier(this);
  }

  protected cache_Metadata?: Promise<AppMetadata>;

  getMetadata(): Promise<AppMetadata> {
    async function impl(this: App): Promise<AppMetadata> {
      const context = await decodeText(await this.getFile('/.metadata'));
      return JSON.parse(context) as AppMetadata;
    }

    if (this.cache_Metadata) return this.cache_Metadata;
    return this.cache_Metadata = impl.apply(this);
  }

  async getFile(path: string): Promise<AsyncIterable<Uint8Array>> {
    return CoreIPFS.getFile(this.addr + path);
  }

  async getDataBase(name: string): Promise<DBStore> {
    const metadata = await this.getMetadata();
    const db = metadata.databases.find(it => it.name == name);
    if (!db) throw notFound('App not define database ' + name, {app: this.addr, name});
    return DBManager.getDataBase(db);
  }

  async hasPermission(permission: string) {
    const declared = (await this.getMetadata()).permissions;
    if (permission ! in declared) return false;
    return !!(await CoreIPFS.config.get(this.id.permissionNode(permission)).catch(() => false));
  }

  async grantPermission(permission: string) {
    const declared = (await this.getMetadata()).permissions;
    if (permission ! in declared) return false;
    await CoreIPFS.config.set(this.id.permissionNode(permission), true);
    return true;
  }

  async getService(name: string): Promise<string> {
    const metadata = await this.getMetadata();
    if (!metadata.services || !metadata.services[name])
      throw Boom.notFound('Not found service ' + name, {app: this.id, name, services: metadata.services});
    return this.id.url + metadata.services[name];
  }
}

export class PublicApp extends App {
  constructor(id, addr) {
    super(id, addr);
  }
}

export class PrivateApp extends App {
  constructor(public readonly id: AppId) {
    console.assert(id.type === 'dev');
    super(id, '/apps/' + id.name);
  }

  async getCid(): Promise<CID> {
    return (await CoreIPFS.inst.files.stat(this.addr)).cid;
  }

  async getKey(): Promise<PrivateKey> {
    const key = await CoreIPFS.libp2p.keychain!!.exportKey(this.id.name, 'temp');
    return await keys.import(key, 'temp');
  }

  async init() {
    try {
      const key = await CoreIPFS.inst.key.gen(this.id.name);
      console.log(`generate key for app ${key.name}: ${key.id}`);
    } catch (e) {//exists
    }
    try {
      await CoreIPFS.inst.files.mkdir(this.addr);
    } catch (e) {//exists
    }

    await this.setMetadata({permissions: [], databases: [], desc: {}, services: {}});
    await this.uploadFile('/public/index.html', 'Hello world');
  }

  async getProd(): Promise<PublicApp | null> {
    const record = await CoreIPFS.inst.key.info(this.id.name);
    try {
      return await AppManager.get(new AppId('ipns', peerIdBase32(record.id)));
    } catch (e) {
      return null;
    }
  }

  /**
   * 当路径为/结尾时,仅新建目录
   */
  async uploadFile(path: string, data: string | Uint8Array | Blob | AsyncIterable<Uint8Array>) {
    await CoreIPFS.inst.files.write(this.addr + path, data, {
      parents: true,
      create: true,
      flush: true,
    });
    console.info('Upload to ' + this.addr + path);
  }

  /**
   * @param options 需要相关的属性
   */
  async editMetadata(options: Partial<AppMetadata>) {
    await this.setMetadata(Object.assign(await this.getMetadata(), options));
  }

  async setMetadata(content: AppMetadata) {
    await this.uploadFile('/.metadata', JSON.stringify(content));
    this.cache_Metadata = undefined;
  }

  async hasPermission(permission: string): Promise<boolean> {
    if (this.id.name === 'test') return true;
    return super.hasPermission(permission);
  }

  async verify(): Promise<boolean> {
    return true;
  }
}

export class AppManager {
  static async list(): Promise<PrivateApp[]> {
    const keys = await CoreIPFS.inst.key.list();
    return keys.filter(it => it.name != 'self')
      .map(it => new PrivateApp(new AppId('dev', it.name)));
  }

  static async create(name: string): Promise<PrivateApp> {
    const id = new AppId('dev', name);
    await this.get.delete(id);//reset cache
    let exists = false;
    try {
      await CoreIPFS.inst.key.info(id.name);
      exists = true;
    } catch (e: any) {
      if (!e.toString().indexOf('does not exist'))
        console.error(e);
    }
    if (exists)
      throw conflict('App already exists', {app: exists});
    const app = new PrivateApp(id);
    await app.init();
    return app;
  }

  static get = memoizee(async (id: AppId, verify = true) => {
    let app: App;
    switch (id.type) {
      case 'ipns':
        try {
          const res = await last(CoreIPFS.inst.name.resolve(id.name, {recursive: true}));
          if (res) {
            app = new PublicApp(id, res);
            break;
          }
        } catch (e) {//not found
        }
        throw Boom.notFound('App not found: Fail to resolve IPNS', {name: id.name});
      case 'ipfs':
        const cid = CID.parse(id.name);
        app = new PublicApp(id, `/ipfs/${cid}`);
        break;
      case 'dev':
        try {
          await CoreIPFS.inst.key.info(id.name);
          app = new PrivateApp(id);
          break;
        } catch (e: any) {
          throw Boom.notFound('App not exist', {app: id, e});
        }
      case 'sys':
        throw Boom.notImplemented('App resolve for sys');
      default:
        throw Boom.badRequest('invalid app type', {type: id.type});
    }
    if (verify && !await app.verify())
      throw forbidden('App not verify', {app});
    return app;
  }, {
    normalizer(args: Parameters<(id: AppId, verify?: boolean) => Promise<App>>): string {
      return args[0].toString() + (args[1] || true).toString();
    },
  });
}
