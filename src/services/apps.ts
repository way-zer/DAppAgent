import { IpfsService } from './ipfs'
import { IntegrateService } from './integrate'
import { IpfsFiles } from './ipfsFiles'
import { decodeText, peerIdBase32 } from '../util'
import { singletonService, useInject } from '../util/hooks'
import { conflict, forbidden, notFound } from '@hapi/boom'
import { CID } from 'multiformats'
import { AccessType, DataBase, DBService, DBStore, DBType } from './db'
import memoizee from 'memoizee'

export abstract class App {
    async listFile(path: string) {
        const files = await useInject(IpfsFiles)
        return files.listFiles(this.addr + path)
    }
    async getService(name: string): Promise<any> {
        throw new Error('暂未实现')
    }
}

export class PublicApp extends App {
}

export class PrivateApp extends App {
    async publish(): Promise<void> {
        const sign = await (await useInject(IntegrateService)).appRecord(this)
        await this.editMetadata({ recordSign: sign })
        await IpfsService.inst.name.publish(await this.getCid(), { key: this.name })
    }

    async cpFile(from: string, to: string) {
        try {
            return await IpfsService.inst.files.cp(this.addr + from, this.addr + to)
        } catch (e: any) {
            if (e.code == 'ERR_ALREADY_EXISTS')
                throw conflict(e.message)
            else
                throw e
        }
    }

    async delFile(file: string) {
        try {
            return await IpfsService.inst.files.rm(this.addr + file)
        } catch (e: any) {
            if (e.code == 'ERR_NOT_FOUND')
                throw notFound('file ' + file + ' does not exist')
            else
                throw e
        }
    }

    async newDataBase(name: string, type: DBType, access: AccessType) {
        const metadata = await this.getMetadata()
        if ((metadata.databases || []).find(it => it.name === name))
            throw conflict('App has defined database ' + name, { app: this.addr, name })
        const db = await DBService.getDataBase({ name: `${this.name}-db-${name}`, type, access })
        const info = { name, type, access, addr: db.address.toString() }
        await this.editMetadata({ databases: (metadata.databases || []).concat(info) })
        console.info(`New Database for app ${this.name}: `, info)
    }
}
