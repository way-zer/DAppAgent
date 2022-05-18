import OrbitDB from 'orbit-db';
import type OrbitDBStore from 'orbit-db-store';
import {CoreIPFS} from '../ipfs';
import memoizee from 'memoizee';
import Boom, {badRequest} from '@hapi/boom';
import type {AccessType as AccessType0} from './accessController';
import {AccessTypeStruct, MyAccessController} from './accessController';
import {MyIdentityProvider} from '/@/core/db/identityProvider';
import {enums} from 'superstruct';
import {sleep} from '/@/util/async';

export const DBTypeStruct = enums(['docstore', 'keyvalue', 'feed', 'eventlog', 'counter']);
export type DBType = typeof DBTypeStruct['TYPE']
export {AccessTypeStruct} from './accessController';
export type AccessType = AccessType0

export interface DataBase {
    name: string;
    type: DBType;
    access: AccessType;
    addr?: string;
}

export type DBStore = OrbitDBStore

/**
 * OrbitDB封装类
 * 数据库类型 docstore keyvalue feed eventlog counter
 */
export class DBManager {
    static instUnsafe: OrbitDB | null = null;

    static get inst() {
        if (!this.instUnsafe) throw 'OrbitDB hasn\'t start';
        return this.instUnsafe;
    }

    static async start() {
        if (this.instUnsafe) return;
        MyAccessController.register();
        while (CoreIPFS.instUnsafe == null)
            await sleep(100);
        this.instUnsafe = await OrbitDB.createInstance(CoreIPFS.inst, {
            identity: MyIdentityProvider.getIdentity(),
            directory: './DAppAgent/orbitDB',
        });
        console.log('OrbitDB ID is: ', this.instUnsafe.identity.id);
    }

    static async create(info: DataBase): Promise<string> {
        if (!OrbitDB.isValidType(info.type))
            throw badRequest('invalid Type: ' + info.type);
        const db = await this.inst.create(info.name, info.type, {
            accessController: {
                type: 'dapp',
                subType: info.access,
            },
        });
        return db.address.toString();
    }

    static getDataBase = memoizee(async (info: DataBase) => {
        if (!info.addr)
            throw Boom.badRequest('Require addr', {info});
        if (!OrbitDB.isValidType(info.type))
            throw badRequest('invalid Type: ' + info.type);
        const db = await this.inst.open(info.addr, {
            type: info.type,
            accessController: {
                type: 'dapp',
                subType: info.access,
            },
        });
        await db.load();
        return db as DBStore;
    });

    static async stop() {
        const inst = this.instUnsafe;
        if (inst === null) return;
        this.instUnsafe = null;
        await inst.stop();
        console.log('Stopped IPFS');
    }
}
