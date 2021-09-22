import {IpfsService} from './ipfs'
import {IntegrateService} from './integrate'
import {IpfsFiles} from './ipfsFiles'
import {decodeText, peerIdBase32} from '../util'
import {singletonService, useInject} from '../util/hooks'
import {CID} from 'ipfs-core'
import {conflict, forbidden, notFound} from '@hapi/boom'

export interface AppMetadata {
    recordSign?: string
    permissions: string[]
}

export abstract class App {
    /**
     * @param addr /ipns/ for prod or ipfs for dev
     */
    constructor(
        public readonly addr: string,
    ) {
    }

    isProd() {
        return this.addr.startsWith('/ipns/')
    }

    async verify(): Promise<boolean> {
        const sign = (await this.getMetadata()).recordSign
        if (!sign) return false
        const integrate = await useInject(IntegrateService)
        return integrate.appRecordOK(this, sign)
    }

    protected cache_Metadata?: Promise<AppMetadata>

    getMetadata(): Promise<AppMetadata> {
        async function impl(this: App): Promise<AppMetadata> {
            const context = await decodeText(await this.getFile('/.metadata'))
            return JSON.parse(context) as AppMetadata
        }

        if (this.cache_Metadata) return this.cache_Metadata
        return this.cache_Metadata = impl.apply(this)
    }

    async listFile(path: string) {
        const files = await useInject(IpfsFiles)
        return files.listFiles(this.addr + path)
    }

    async getFile(path: string): Promise<AsyncIterable<Uint8Array>> {
        const files = await useInject(IpfsFiles)
        return files.getFile(this.addr + path)
    }

    async getService(name: string): Promise<any> {
        throw new Error('暂未实现')
    }
}

export class PublicApp extends App {
}

export class PrivateApp extends App {
    constructor(public readonly name: string) {
        super('/apps/' + name)
    }

    async getCid(): Promise<CID> {
        return (await IpfsService.inst.files.stat(this.addr)).cid
    }

    async init() {
        try {
            const key = await IpfsService.inst.key.gen(this.name)
            console.log(`generate key for app ${key.name}: ${key.id}`)
        } catch (e) {//exists
        }
        try {
            await IpfsService.inst.files.mkdir(this.addr)
        } catch (e) {//exists
        }

        await this.setMetadata({permissions: []})
        await this.uploadFile('/public/index.html', 'Hello world')
    }

    async publish(): Promise<void> {
        const sign = await (await useInject(IntegrateService)).appRecord(this)
        await this.editMetadata({recordSign: sign})
        await IpfsService.inst.name.publish(await this.getCid(), {key: this.name})
    }

    async getProd(): Promise<PublicApp> {
        const record = await IpfsService.inst.key.info(this.name)
        return (await useInject(AppService))
            .getPublic(`/ipns/${peerIdBase32(record.id)}`, false)
    }

    /**
     * 当路径为/结尾时,仅新建目录
     */
    async uploadFile(path: string, data: string | Uint8Array | Blob | AsyncIterable<Uint8Array>) {
        if (path.endsWith('/'))
            await IpfsService.inst.files.mkdir(this.addr + path, {
                parents: true, flush: true,
            })
        else
            await IpfsService.inst.files.write(this.addr + path, data, {
                parents: true,
                create: true,
                flush: true,
            })
        console.info('Upload to ' + this.addr + path)
    }

    async cpFile(from: string, to: string) {
        try {
            return await IpfsService.inst.files.cp(this.addr + from, this.addr + to)
        } catch (e) {
            if (e.code == 'ERR_ALREADY_EXISTS')
                throw conflict(e.message)
            else
                throw e
        }
    }

    async delFile(file: string) {
        try {
            return await IpfsService.inst.files.rm(this.addr + file)
        } catch (e) {
            if (e.code == 'ERR_NOT_FOUND')
                throw notFound('file ' + file + ' does not exist')
            else
                throw e
        }
    }

    /**
     * @param options 需要相关的属性
     */
    async editMetadata(options: Partial<AppMetadata>) {
        await this.setMetadata(Object.assign(await this.getMetadata(), options))
    }

    async setMetadata(content: AppMetadata) {
        await this.uploadFile('/.metadata', JSON.stringify(content))
        this.cache_Metadata = undefined
    }
}

@singletonService
export class AppService {
    async list(): Promise<PrivateApp[]> {
        const keys = await IpfsService.inst.key.list()
        return keys.filter(it => it.name != 'self')
            .map(it => new PrivateApp(it.name))
    }

    async get(name: string): Promise<PrivateApp | null> {
        name = name.toLowerCase()
        try {
            await IpfsService.inst.key.info(name)
            return new PrivateApp(name)
        } catch (e) {
            if (!e.toString().indexOf('does not exist'))
                console.error(e)
            return null
        }
    }

    async create(name: string): Promise<PrivateApp> {
        name = name.toLowerCase()
        const exists = await this.get(name)
        if (exists)
            throw conflict('App already exists', {app: exists})
        const app = new PrivateApp(name)
        await app.init()
        return app
    }

    async getPublic(addr: string, verify: boolean = true): Promise<PublicApp> {
        //TODO 增加cache和签名验证
        const app = new PublicApp(addr)
        if (verify && !await app.verify())
            throw forbidden('App not verify', {app})
        return app
    }
}