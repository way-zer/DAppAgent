import {Inject, Provide, Scope, ScopeEnum} from '@midwayjs/decorator'
import {IpfsService} from './ipfs'
import {IntegrateService} from './integrate'
import {IpfsFiles} from './ipfsFiles'
import {decodeText} from '../util'
import assert from 'assert'
import {useInject} from '@midwayjs/hooks'

export abstract class App {
    async verify(): Promise<boolean> {
        const sign = (await this.getMetadata()).recordSign
        if (!sign) return false
        const integrate = await useInject(IntegrateService)
        return integrate.appRecordOK(this, sign)
    }

    protected cache_Metadata?: Promise<AppMetadata>

    getMetadata(): Promise<AppMetadata> {
        async function impl(this: App) {
            const context = await decodeText(await this.getFile('/.metadata'))
            return JSON.parse(context) as AppMetadata
        }

        if (this.cache_Metadata) return this.cache_Metadata
        return this.cache_Metadata = impl.apply(this)
    }

    abstract getFile(path: string): Promise<AsyncIterable<Uint8Array>>

    async getService(name: string): Promise<any> {
        throw '暂未实现'
    }
}

export class PublicApp extends App {
    /**
     * @param addr /ipns/ for prod or /ipfs/ for dev
     */
    constructor(
        public readonly addr: string,
    ) {
        super()
    }

    async getFile(path: string): Promise<AsyncIterable<Uint8Array>> {
        const files = await useInject(IpfsFiles)
        return files.getFile(this.addr + path)
    }
}

export class PrivateApp extends App {
    ipfs!: IpfsService

    constructor(public readonly name: string) {
        super()

    }

    async init() {
        const key = await this.ipfs.inst.key.gen(this.name)
        console.log(`generate key for app ${key.name}: ${key.id}`)
        await this.editMetadata({permissions: []})
        await this.uploadFile('/public/index.html', 'Hello world')
    }

    async getFile(path: string): Promise<AsyncIterable<Uint8Array>> {
        return this.ipfs.inst.files.read('/apps/' + this.name + path)
    }

    async publish(): Promise<PublicApp> {
        const sign = await (await useInject(IntegrateService)).appRecord(this)
        await this.editMetadata({recordSign: sign})
        const dir = await this.ipfs.inst.files.stat(`/apps/${this.name}/`)
        const record = await this.ipfs.inst.name.publish(dir.cid, {key: this.name})
        return (await useInject(AppService)).get(`/ipns/${record.name}`)
    }

    async uploadFile(path: string, data: string | Uint8Array | Blob) {
        await this.ipfs.inst.files.write('/apps/' + this.name + path, data, {
            parents: true,
            create: true,
        })
    }

    /**
     * @param options 需要相关的属性
     * @param full 直接替换文件
     */
    async editMetadata(options: Partial<AppMetadata>, full: boolean = false) {
        const n = full ? options : Object.assign(options, await this.getMetadata())
        await this.uploadFile('/.metadata', JSON.stringify(n))
        this.cache_Metadata = undefined
    }
}

export interface AppMetadata {
    recordSign?: string
    permissions: string[]
}

@Provide()
@Scope(ScopeEnum.Singleton)
export class AppService {
    @Inject()
    private ipfs!: IpfsService

    async create(name: string): Promise<PrivateApp> {
        const app = new PrivateApp(name)
        app.ipfs = this.ipfs
        await app.init()
        return app
    }

    async get(addr: string): Promise<PublicApp> {
        //TODO 增加cache和签名验证
        const app = new PublicApp(addr)
        assert(await app.verify())
        return app
    }
}