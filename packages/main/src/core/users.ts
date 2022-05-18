import {CoreIPFS} from './ipfs';
import PeerId from 'peer-id';
import {DagConfigFile, IPFSFile} from '/@/util/ipfsFile';
import Boom from '@hapi/boom';

export interface UserMetadata {
    verifySign?: string;
}

export class User {
    readonly metadataFile: DagConfigFile<UserMetadata>;

    constructor(public readonly id: PeerId) {
        this.metadataFile = new IPFSFile(`/user/${id.toB58String()}`).asDagConfig<UserMetadata>();
    }

    async loadMetadata() {
        const addr = await CoreIPFS.resolveIPNS(this.id);
        if (!addr) throw Boom.notFound('IPNS notfound for ' + this.id.toB58String());
        await this.metadataFile.file.cpFrom(addr);
        this.metadataFile.invalidCache();
    }

    async publishMetadata() {
        if (!this.id.privKey) throw Boom.forbidden('Can only update self');
        await CoreIPFS.publishIPNS(this.id, await this.metadataFile.file.cid());
    }
}

/** 储存用户信息及所有PeerId/密钥 */
export class UserManager {
    static verifier: (app: User) => Promise<boolean> = async () => true;

    static self() {
        return new User(CoreIPFS.libp2p.peerId);
    }

    static async verify() {
        const user = await this.self();
        return UserManager.verifier(user);
    }
}
