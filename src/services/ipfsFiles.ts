import {Inject, Provide, Scope, ScopeEnum} from '@midwayjs/decorator'
import {IpfsService} from './ipfs'
import last from 'it-last'

type FileContent = AsyncIterable<Uint8Array>

@Provide()
@Scope(ScopeEnum.Singleton)
export class IpfsFiles {
    @Inject()
    ipfs!: IpfsService

    async resolvePath(path: string): Promise<string> {
        if (path.startsWith('/ipfs/')) return path
        return await last(this.ipfs.inst.name.resolve(path, {recursive: true})) || path
    }

    async tryIndexFile(path0: string): Promise<FileContent | null> {
        const path = await this.resolvePath(path0)
        if (!path.endsWith('/')) return null
        for (const file in ['index.html']) {
            try {
                await this.ipfs.inst.files.stat(path + file)
                return this.getFile(path + file)
            } catch (e) {
            }
        }
        return null
    }

    async getFile(path0: string, includeIndex: boolean = false): Promise<FileContent> {
        const path = await this.resolvePath(path0)
        if (path.endsWith('/')) {
            if (includeIndex) {
                const ret = await this.tryIndexFile(path)
                if (ret) return ret
                throw new Error('Index File Not Found')
            }
            throw new Error('Target Not a File')
        }
        return this.ipfs.inst.cat(path)
    }
}