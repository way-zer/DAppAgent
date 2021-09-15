import {IpfsService} from './ipfs'
import last from 'it-last'
import {toArray} from '../util'
import {notFound} from '@hapi/boom'
import {singletonService} from '../util/hooks'

type FileContent = AsyncIterable<Uint8Array>

@singletonService
export class IpfsFiles {
    get impl() {
        return IpfsService.inst.files
    }

    async resolveIPNS(path: string): Promise<string> {
        if (path.startsWith('/ipns/'))
            try {
                return await last(IpfsService.inst.name.resolve(path, {recursive: true})) || path
            } catch (e) {
                throw notFound('Fail to resolve IPNS', {path})
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
            throw notFound('File not found', {path, rawPath: path0})
        }
        return this.impl.read(path)
    }

    async listFiles(path0: string) {
        const path = await this.resolveIPNS(path0)
        return toArray(IpfsService.inst.files.ls(path))
    }
}