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
    this.metadataFile = new IPFSFile(`/ipns/${id.toB58String()}`).asDagConfig<UserMetadata>();
  }

  async updateMetadata(value: UserMetadata) {
    if (!this.id.privKey) throw Boom.forbidden('Can only update self');
    const cid = await CoreIPFS.inst.dag.put(value);
    await CoreIPFS.publishIPNS(this.id, cid);
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
