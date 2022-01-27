import Boom from '@hapi/boom';
import {CoreIPFS} from '/@/core/ipfs';
import {decodeText} from '/@/util/index';
import {IPFSPath} from 'ipfs-core-types/types/src/utils';

export class IPFSFile {
  constructor(public readonly path: string) {
  }

  /**@throws Boom.notfound */
  async stat() {
    const path = this.path;
    try {
      return (await CoreIPFS.inst.files.stat(path));
    } catch (e) {
      throw Boom.notFound('File not found', {path});
    }
  }

  async exists() {
    try {
      await this.stat();
      return true;
    } catch (_) {
      return false;
    }
  }

  /**@throws Boom.notfound */
  async cid() {
    return (await this.stat()).cid;
  }

  async cpFrom(path: IPFSPath) {
    const bak = this.path + '.bak';
    await CoreIPFS.inst.files.mv(this.path, bak).catch(() => null);

    try {
      await CoreIPFS.inst.files.cp(path, this.path);
      await CoreIPFS.inst.files.rm(bak).catch(() => null);//del bak
    } catch {
      await CoreIPFS.inst.files.mv(bak, this.path).catch(() => null);//recover
    }
  }

  /**@throws Boom.notfound */
  async read(): Promise<AsyncIterable<Uint8Array>> {
    await this.stat();//ensure exist
    return CoreIPFS.inst.files.read(this.path);
  }

  async write(content: Parameters<(typeof CoreIPFS)['inst']['files']['write']>[1]) {
    await CoreIPFS.inst.files.write(this.path, content, {create: true});
  }

  asDagConfig<T extends object>() {
    return new DagConfigFile<T>(this);
  }

  asJsonConfig<T extends object>() {
    return new JsonConfigFile<T>(this);
  }
}

export abstract class ConfigFile<T extends object> {
  abstract get(): Promise<T>

  abstract set(value: T)

  async edit(patch: Partial<T>) {
    const value = await this.get();
    Object.assign(value, patch);
    await this.set(value);
  }
}

export class DagConfigFile<T extends object> extends ConfigFile<T> {
  constructor(public readonly file: IPFSFile) {
    super();
  }

  async get(): Promise<T> {
    const cid = await this.file.cid();
    return (await CoreIPFS.inst.dag.get(cid)).value as T;
  }

  async set(value: T) {
    const cid = await CoreIPFS.inst.dag.put(value);
    try {
      await CoreIPFS.inst.files.rm(this.file.path);
    } catch (_) {
    }
    await CoreIPFS.inst.files.cp(cid, this.file.path, {parents: true});
  }
}

export class JsonConfigFile<T extends object> extends ConfigFile<T> {
  constructor(public readonly file: IPFSFile) {
    super();
  }

  async set(value: T) {
    await this.file.write(JSON.stringify(value));
  }

  async get(): Promise<T> {
    return JSON.parse(
      await decodeText(await this.file.read()),
    ) as T;
  }
}
