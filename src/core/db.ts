import OrbitDB from 'orbit-db'
import OrbitDBStore from 'orbit-db-store'
import { IpfsService } from './ipfs'
import memoizee from 'memoizee'
import { badRequest } from '@hapi/boom'
import { AccessType as AccessType0, MyAccessController } from './db/accessController'
import { Boom } from '../util'

export type DBType = 'docstore' | 'keyvalue' | 'feed' | 'eventlog' | 'counter'
export type AccessType = AccessType0

export interface DataBase {
    name: string
    type: DBType
    access: AccessType
    addr?: string
}

export type DBStore = OrbitDBStore

/**
 * OrbitDB封装类
 * 数据库类型 docstore keyvalue feed eventlog counter
 */
class DBServiceClass {
    instUnsafe: OrbitDB | null = null

    get inst() {
        if (!this.instUnsafe) throw 'OrbitDB hasn\'t start'
        return this.instUnsafe
    }

    async start() {
        if (this.instUnsafe) return
        MyAccessController.register()
        this.instUnsafe = await OrbitDB.createInstance(IpfsService.inst, {
            directory: './DAppAgent/orbitDB',
        })
        console.log('OrbitDB ID is: ', this.instUnsafe.identity.id)
    }

    async create(info: DataBase): Promise<string> {
        if (!OrbitDB.isValidType(info.type))
            throw badRequest('invalid Type: ' + info.type)
        const db = await this.inst.create(info.name, info.type, {
            accessController: {
                type: 'dapp',
                subType: info.access,
            },
        })
        return db.address.toString()
    }

    getDataBase = memoizee(async (info: DataBase) => {
        if (!info.addr)
            throw Boom.badRequest("Require addr", { info })
        if (!OrbitDB.isValidType(info.type))
            throw badRequest('invalid Type: ' + info.type)
        const db = await this.inst.open(info.addr, {
            type: info.type,
            accessController: {
                type: 'dapp',
                subType: info.access,
            },
        })
        await db.load()
        return db as DBStore
    })

    async stop() {
        const inst = this.instUnsafe
        if (inst === null) return
        this.instUnsafe = null
        await inst.stop()
        console.log('Stopped IPFS')
    }
}

//special singleton, as Ipfs is slow to start when hot reload.
export const DBService = new DBServiceClass()