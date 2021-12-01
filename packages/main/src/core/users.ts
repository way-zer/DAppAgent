import type {Secret} from './ipfs';
import {CoreIPFS} from './ipfs';


export type User = Secret

export interface UserMetadata {
  verifySign?: string;
}

export class UserManager {
  static verifier: (app: User) => Promise<boolean> = async () => true;

    static async self(): Promise<User> {
      return CoreIPFS.inst.key.info('self');
    }

    static async verify() {
      const user = await this.self();
      return UserManager.verifier(user);
    }

    /**
     * @param user0 用户,留空为自己
     */
    static async getMetadata(user0?: User): Promise<UserMetadata> {
      const user = user0 || await this.self();
      throw '';/*TODO
         通过metadata反JSON
     */
    }
}
