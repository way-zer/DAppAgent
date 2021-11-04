import {checkChange} from '../util/hmrHelper'
import OrbitDB from 'orbit-db'
import OrbitDBStore from 'orbit-db-store'
import {IpfsService} from './ipfs'
import memoizee from 'memoizee'
import {badRequest} from '@hapi/boom'
import {AccessType as AccessType0, MyAccessController} from './db/accessController'

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
        await checkChange('orbitDB', this, (old) => old.stop())

        MyAccessController.register()
        this.instUnsafe = await OrbitDB.createInstance(IpfsService.inst, {
            directory: './DAppAgent/orbitDB',
        })
        console.log('OrbitDB ID is: ', this.instUnsafe.identity.id)
    }

    getDataBase = memoizee(async (info: DataBase) => {
        if (!OrbitDB.isValidType(info.type))
            throw badRequest('invalid Type: ' + info.type)
        const db = await this.inst.open(info.addr || info.name, {
            create: true,
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