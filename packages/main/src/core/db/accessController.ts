import AccessControllers from 'orbit-db-access-controllers/src/access-controllers';
import OrbitDBAccessController from 'orbit-db-access-controllers/src/orbitdb-access-controller';
import {enums} from 'superstruct';

export const AccessTypeStruct = enums(['private', 'selfWrite']);
export type AccessType = typeof AccessTypeStruct['TYPE']
const superAdmins = [];//超级管理,可以编辑所有数据库

export class MyAccessController extends OrbitDBAccessController {
    static register() {
        AccessControllers.addAccessController({
            AccessController: MyAccessController,
        });
    }

    static get type() {
        return 'dapp';
    }

    static async create(orbitDB, options: {
        address?: string,//not once
        name?: string,//when create
        type: MyAccessController['type'],
        subType: AccessType
    }) {
        if (!options.subType) throw new Error('Need subType');
        const ac = new MyAccessController(orbitDB, {
            admin: [...superAdmins, orbitDB.identity.id],
        });
        ac.subType = options.subType;
        await ac.load(options.address || options.name!);
        return ac;
    }

    /**
     * private: 仅发布者本人可读写 (或admin组)
     * selfWrite: 所有人可修改本人发布内容,admin组仍可修改所有
     */
    subType!: AccessType;

    override async canAppend(entry: LogEntry<any>, identityProvider) {
        console.log(entry);
        if (await super.canAppend(entry, identityProvider)) return true;
        if (this.subType === 'private') return false;
        if (this.subType === 'selfWrite') {
            //TODO
        }
        return false;
    }

    async load(address) {
        return super.load(address);
    }

    async save() {
        return Object.assign(await super.save(), {
            subType: this.subType,
        });
    }
}
