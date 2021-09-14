import {IntegrateService} from './integrate'
import {IpfsService, Secret} from './ipfs'
import {fluentProvide, inject} from 'daruk'


export type User = Secret

export interface UserMetadata {
    verifySign?: string
}

@(fluentProvide('UserService')
    .inSingletonScope()
    .done())
export class UserService {
    @inject('IntegrateService')
    private integrate!: IntegrateService

    async self(): Promise<User> {
        return IpfsService.inst.key.info('self')
    }

    async verify() {
        const user = await this.self()
        if ((await this.getMetadata(user)).verifySign) return
        const sign = await this.integrate.userVerify(user)
        //TODO 设置签名
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