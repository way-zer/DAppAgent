import {IntegrateService} from './integrate'
import {IpfsService, Secret} from './ipfs'
import {Inject, Provide, Scope, ScopeEnum} from '@midwayjs/decorator'


export type User = Secret

export interface UserMetadata {
    verifySign?: string
}

@Provide()
@Scope(ScopeEnum.Singleton)
export class UserService {
    @Inject()
    private integrate!: IntegrateService
    @Inject()
    private ipfs!: IpfsService

    async self(): Promise<User> {
        return this.ipfs.safeInst.key.info('self')
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