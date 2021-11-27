import { IpfsService, Secret } from './ipfs'
import { inject } from 'daruk'
import { singletonService } from '../util/hooks'


export type User = Secret

export interface UserMetadata {
    verifySign?: string
}

@singletonService
export class UserService {
    static verifier: (app: User) => Promise<boolean> = async () => true

    async self(): Promise<User> {
        return IpfsService.inst.key.info('self')
    }

    async verify() {
        const user = await this.self()
        return UserService.verifier(user)
    }

    /**
     * @param user0 用户,留空为自己
     */
    async getMetadata(user0?: User): Promise<UserMetadata> {
        const user = user0 || await this.self()
        throw ''/*TODO
    通过metadata反JSON
     */
    }
}