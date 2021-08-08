import {CID} from 'ipfs-core'
import {Inject, Provide, Scope, ScopeEnum} from '@midwayjs/decorator'
import {IpfsService, Secret} from './ipfs'
import {IntegrateService} from './integrate'
import {toArray} from '../util'
import toStream from 'it-to-stream'

export type App = Secret

export interface AppMetadata {
    recordSign?: string
    permissions: string[]
}

@Provide()
@Scope(ScopeEnum.Singleton)
export class AppService {
    @Inject()
    private integrate!: IntegrateService
    @Inject()
    private ipfs!: IpfsService

    async create(name: string): Promise<App> {
        return await this.ipfs.inst.key.gen(name)
    }

    async publish(appName: string, cid: CID) {
        //TODO
    }

    /**
     * @param appName app的key名
     * @param options 需要相关的属性
     */
    async editMetadata(appName: string, options: Partial<AppMetadata>) {

    }

    /**
     * 获取App的元数据
     * @param appAddr app的地址
     */
    async getMetadata(appAddr: string): Promise<AppMetadata> {
        this.ipfs.inst.name.resolve
        //TODO
        throw ''
    }

    /**
     * 获取App的静态资源文件
     * @return 文件流/文件内容 待定
     */
    async getFile(appAddr: string, path: string): Promise<ReadableStream> {
        this.ipfs.inst.dns
        let name: string
        if(appAddr.startsWith("/ipfs/"))
            name = appAddr
        else{
            try {
                name = (await toArray(this.ipfs.inst.name.resolve(appAddr)))[0]
            } catch (e) {
                throw 'can\'t resolve ' + appAddr + ':' + e
            }
        }
        return toStream(this.ipfs.inst.cat(name + path))
    }

    async getService(appAddr: string, name: string): Promise<any> {
        throw '暂未实现'
    }
}