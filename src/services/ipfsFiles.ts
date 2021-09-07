import {Inject, Provide, Scope, ScopeEnum} from '@midwayjs/decorator'
import {IpfsService} from './ipfs'
import last from 'it-last'
import {ErrorType, MyError} from '../util/myError'
import {toArray} from '../util'

type FileContent = AsyncIterable<Uint8Array>

@Provide()
@Scope(ScopeEnum.Singleton)
export class IpfsFiles {
    @Inject()
    ipfs!: IpfsService

    get impl() {
        return this.ipfs.inst.files
    }

    async resolveIPNS(path: string): Promise<string> {
        if (path.startsWith('/ipns/'))
            try {
                return await last(this.ipfs.inst.name.resolve(path, {recursive: true})) || path
            } catch (e) {
                throw new MyError(ErrorType.notFound, {path})
            }
        return path
    }

    async tryIndexFile(path0: string): Promise<FileContent | null> {
        const path = await this.resolveIPNS(path0)
        if (!path.endsWith('/')) return null
        for (const file in ['index.html']) {
            try {
                await this.impl.stat(path + file)
                return this.getFile(path + file)
            } catch (e) {
            }
        }
        return null
    }

    async getFile(path0: string, includeIndex: boolean = false): Promise<FileContent> {
        const path = await this.resolveIPNS(path0)
        console.log(path)
        if (path.endsWith('/')) {
            if (includeIndex) {
                const ret = await this.tryIndexFile(path)
                if (ret) return ret
                throw new Error('Index File Not Found')
            }
            throw new Error('Target Not a File')
        }
        try {
            await this.impl.stat(path)
        } catch (e) {
            throw new MyError(ErrorType.notFound, {})
        }
        return this.impl.read(path)
    }

    async listFiles(path0: string) {
        const path = await this.resolveIPNS(path0)
        return toArray(this.ipfs.inst.files.ls(path))
    }
}