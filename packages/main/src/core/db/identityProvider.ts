import {Identity, IdentityProvider} from 'orbit-db-identity-provider';
import {UserManager} from '/@/core/users';
import PeerId from 'peer-id';
import {base64pad} from 'multiformats/types/src/bases/base64';

const type = 'dappAgent';

// noinspection JSUnusedGlobalSymbols
/**
 * 使用IPFS的PeerId作为OrbitDB的Identity, 并处理签名及验证.
 */
export class MyIdentityProvider extends IdentityProvider {
  static get type() {
    return type;
  }

  async getId(): Promise<string> {
    return UserManager.self().id.toString();
  }

  async signIdentity(data) {
    return await UserManager.self().id.privKey.sign(data);
  }

  async verity(sig, publicKey, data) {
    const peer = await PeerId.createFromPubKey(publicKey);
    return await peer.pubKey.verify(data, sig);
  }

  static async verifyIdentity(identity: Identity) {
    const peer = await PeerId.createFromPubKey(identity.publicKey);
    return peer.equals(PeerId.parse(identity.id));
  }

  //ext
  static inst = new MyIdentityProvider({});

  static getIdentity() {
    const id = UserManager.self().id;
    return new Identity(id.toString(), base64pad.baseEncode(id.marshalPubKey()), '', '', type, MyIdentityProvider.inst);
  }
}
