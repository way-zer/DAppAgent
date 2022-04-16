import {CID} from 'multiformats';
import last from 'it-last';
import {CoreIPFS} from '/@/core/ipfs';
import {IPFSFile} from '/@/util/ipfsFile';
import Boom from '@hapi/boom';
import config from 'config/main.json';

type KnownAppType = 'ipns' | 'ipfs' | 'sys' | 'dev'

export class AppId {
    constructor(public readonly type: KnownAppType | string, public readonly name: string) {
        this.name = name.toLowerCase();
    }

    toString() {
        return `${this.type}:${this.name}`;
    }

    get url() {
        return `dapp://${this.name}.${this.type}`;
    }

    equals(other: any) {
        if (other instanceof AppId) {
            return other.name === this.name && other.type === this.type;
        }
        return false;
    }

    get needUpdate() {
        return AppIdRegistry.needUpdate(this);
    }

    async resolve(): Promise<CID | null> {
        return AppIdRegistry.resolve(this);
    }

    static fromString(id: string) {
        const [type, name] = id.split(':');
        return new AppId(type, name);
    }
}

export class AppIdRegistry {
    static needUpdate(id: AppId): boolean {
        switch (id.type) {
            case 'ipns':
            case 'sys':
                return true;
            case 'ipfs':
            case 'dev':
            default:
                return false;
        }
    }

    static async resolve(id: AppId): Promise<CID | null> {
        switch (id.type) {
            case 'ipns':
                const addr = await last(CoreIPFS.inst.name.resolve(id.name, {recursive: true})).catch(() => null);
                if (!addr) return null;
                return await new IPFSFile(addr).cid();
            case 'ipfs':
                return CID.parse(id.name);
            case 'sys':
                const apps = config.sysApp;
                if (!(id.name in apps))
                    throw Boom.notFound('Sys app not exists', {id});
                return await AppIdRegistry.resolve(AppId.fromString(apps[id.name]));
            case 'dev':
            default:
                throw Boom.badRequest('NOT Support resolve');
        }
    }
}
