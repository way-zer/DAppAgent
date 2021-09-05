import {Inject, Provide, Scope, ScopeEnum} from '@midwayjs/decorator'
import {bases} from 'multiformats/basics'
import {IpfsService} from './ipfs'
import {IntegrateService} from './integrate'
import {IpfsFiles} from './ipfsFiles'
import {decodeText} from '../util'
import assert from 'assert'
import {useInject} from '@midwayjs/hooks'
import {CID} from 'ipfs-core'
import last from 'it-last'

export abstract class App {
    async verify(): Promise<boolean> {
        const sign = (await this.getMetadata()).recordSign
        if (!sign) return false
        const integrate = await useInject(IntegrateService)
        return integrate.appRecordOK(this, sign)
    }

    protected cache_Metadata?: Promise<AppMetadata>

    getMetadata(): Promise<AppMetadata> {
        async function impl(this: App): Promise<AppMetadata> {
            try {
                const context = await decodeText(await this.getFile('/.metadata'))
                return JSON.parse(context) as AppMetadata
            } catch (e) {
                if (e.message === IpfsFiles.NOT_FOUND)
                    return {permissions: []}
                throw e
            }
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
        //TODO 判重
        const key = await this.ipfs.inst.key.gen(this.name)
        console.log(`generate key for app ${key.name}: ${key.id}`)
        try {
            await this.ipfs.inst.files.mkdir(`/apps/${this.name}`)
        } catch (e) {//already exists
        }
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
        console.log(dir.cid)
        console.log(await last(this.ipfs.inst.name.resolve(record.name)))
        const addr = CID.parse(record.name).toV1().toString(bases.base32.encoder)
        return (await useInject(AppService)).get(`/ipns/${addr}`)
    }

    async toPublic(): Promise<PublicApp> {
        const record = await this.ipfs.inst.key.info(this.name)
        const addr = CID.parse(record.id).toV1().toString(bases.base32.encoder)
        return (await useInject(AppService)).get(`/ipns/${addr}`, false)
    }

    async uploadFile(path: string, data: string | Uint8Array | Blob) {
        await this.ipfs.inst.files.write('/apps/' + this.name + path, data, {
            parents: true,
            create: true,
            flush: true,
        })
    }

    /**
     * @param options 需要相关的属性
     * @param full 直接替换文件
     */
    async editMetadata(options: Partial<AppMetadata>, full: boolean = false) {
        const n = full ? options : Object.assign(await this.getMetadata(), options)
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

    async listPrivate(): Promise<PrivateApp[]> {
        const keys = await this.ipfs.inst.key.list()
        return keys.filter(it => it.name != 'self').map(it => {
            const app = new PrivateApp(it.name)
            app.ipfs = this.ipfs
            return app
        })
    }

    async create(name: string): Promise<PrivateApp> {
        const app = new PrivateApp(name)
        app.ipfs = this.ipfs
        await app.init()
        return app
    }

    async get(addr: string, verify: boolean = true): Promise<PublicApp> {
        //TODO 增加cache和签名验证
        const app = new PublicApp(addr)
        if (verify)
            assert(await app.verify())
        return app
    }
}