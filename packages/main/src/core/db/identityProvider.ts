import {IdentityProvider} from 'orbit-db-identity-provider';
import Identity from 'orbit-db-identity-provider/src/identity';
import {UserManager} from '/@/core/users';
import PeerId from 'peer-id';
import {base64pad} from 'multiformats/bases/base64';

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

    async signIdentity(data): Promise<string> {
        return base64pad.encode(await UserManager.self().id.privKey.sign(data));
    }

    async sign(identity: Identity, data) {
        return this.signIdentity(data);
    }

    async verity(sig: string, publicKey: string, data) {
        const peer = await PeerId.createFromPubKey(base64pad.decode(publicKey));
        return await peer.pubKey.verify(data, base64pad.decode(sig));
    }

    async verifyIdentity(identity: Identity) {
        const peer = await PeerId.createFromPubKey(base64pad.decode(identity.publicKey));
        return peer.equals(PeerId.parse(identity.id));
    }

    //ext
    static inst = new MyIdentityProvider({});

    static getIdentity() {
        const id = UserManager.self().id;
        return new Identity(id.toString(), base64pad.encode(id.marshalPubKey()), '', '', type, MyIdentityProvider.inst);
    }
}
