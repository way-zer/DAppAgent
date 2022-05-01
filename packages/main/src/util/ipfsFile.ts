import Boom from '@hapi/boom';
import {CoreIPFS} from '/@/core/ipfs';
import {decodeText} from '/@/util/index';
import {CID} from 'ipfs-core';

export class IPFSFile {
    constructor(public readonly path: string) {
    }

    /**@throws Boom.notfound */
    async stat() {
        const path = this.path;
        try {
            return (await CoreIPFS.inst.files.stat(path, {timeout: 3000}));
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

    async cpFrom(path: CID | string) {
        const tmp = this.path + '.tmp';
        await CoreIPFS.inst.files.cp(path, tmp, {parents: true, timeout: 10000});
        await CoreIPFS.inst.files.rm(this.path).catch(() => null);//del old
        await CoreIPFS.inst.files.mv(tmp, this.path);
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
    private static NotInit = Symbol() as any;
    private cache: T = ConfigFile.NotInit;

    abstract get0(): Promise<T>

    abstract set0(value: T): Promise<void>

    async get(): Promise<T> {
        if (this.cache != ConfigFile.NotInit)
            return this.cache;
        this.cache = await this.get0();
        return this.cache;
    }

    async set(value: T) {
        this.cache = value;
        await this.set0(value);
    }


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

    async get0(): Promise<T> {
        const cid = await this.file.cid();
        return (await CoreIPFS.inst.dag.get(cid)).value as T;
    }

    async set0(value: T) {
        const cid = await CoreIPFS.inst.dag.put(value);
        await this.file.cpFrom(cid);
    }
}

export class JsonConfigFile<T extends object> extends ConfigFile<T> {
    constructor(public readonly file: IPFSFile) {
        super();
    }

    async set0(value: T) {
        await this.file.write(JSON.stringify(value));
    }

    async get0(): Promise<T> {
        return JSON.parse(
            await decodeText(await this.file.read()),
        ) as T;
    }
}
