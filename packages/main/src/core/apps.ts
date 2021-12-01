import {CoreIPFS} from './ipfs';
import {decodeText, peerIdBase32} from '../util';
import {conflict, forbidden, notFound} from '@hapi/boom';
import type {CID} from 'multiformats';
import type {DataBase, DBStore} from './db';
import {DBManager} from './db';
import memoizee from 'memoizee';

export interface AppDesc {
  title: string,
  desc: string,
  author: string,
  icon: string,
  tags: string[],
  links: Record<string, string>,
}

export interface AppMetadata {
    recordSign?: string
    permissions: string[]
    databases: DataBase[]
    desc: Partial<AppDesc>//may not full
}

export abstract class App {
  static verifier: (app: App) => Promise<boolean> = async () => true;
    /**
     * @param addr /ipns/ for prod or ipfs for dev
     */
    constructor(
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

    hasPermission(permssion: string) {
        //TODO 权限检测: metadata有声明，且进行过授权
      return true;
    }

    async getService(name: string): Promise<any> {
      throw new Error('暂未实现');
    }
}

export class PublicApp extends App {
}

export class PrivateApp extends App {
    constructor(public readonly name: string) {
      super('/apps/' + name);
    }

    async getCid(): Promise<CID> {
      return (await CoreIPFS.inst.files.stat(this.addr)).cid;
    }

    async init() {
      try {
        const key = await CoreIPFS.inst.key.gen(this.name);
        console.log(`generate key for app ${key.name}: ${key.id}`);
      } catch (e) {//exists
      }
      try {
        await CoreIPFS.inst.files.mkdir(this.addr);
      } catch (e) {//exists
      }

      await this.setMetadata({permissions: [], databases: [], desc: {}});
      await this.uploadFile('/public/index.html', 'Hello world');
    }

    async getProd(): Promise<PublicApp> {
      const record = await CoreIPFS.inst.key.info(this.name);
      return AppManager.getPublic(`/ipns/${peerIdBase32(record.id)}`, false);
    }

    /**
     * 当路径为/结尾时,仅新建目录
     */
    async uploadFile(path: string, data: string | Uint8Array | Blob | AsyncIterable<Uint8Array>) {
      if (path.endsWith('/'))
        await CoreIPFS.inst.files.mkdir(this.addr + path, {
          parents: true, flush: true,
        });
      else
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
}

export class AppManager {
    static async list(): Promise<PrivateApp[]> {
      const keys = await CoreIPFS.inst.key.list();
      return keys.filter(it => it.name != 'self')
        .map(it => new PrivateApp(it.name));
    }

  static get = memoizee(async (name: string) => {
    name = name.toLowerCase();
    try {
      await CoreIPFS.inst.key.info(name);
      return new PrivateApp(name);
    } catch (e: any) {
      if (!e.toString().indexOf('does not exist'))
        console.error(e);
      return null;
    }
  });

    static async create(name: string): Promise<PrivateApp> {
      name = name.toLowerCase();
      this.get.delete(name);//reset cache
      const exists = await this.get(name);
      if (exists)
        throw conflict('App already exists', {app: exists});
      const app = new PrivateApp(name);
      await app.init();
      return app;
    }

  static getPublic = memoizee(async (addr: string, verify = true) => {
    const app = new PublicApp(addr);
    if (verify && !await app.verify())
      throw forbidden('App not verify', {app});
    return app;
  });
}
