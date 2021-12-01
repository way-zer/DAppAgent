import AccessControllers from 'orbit-db-access-controllers/src/access-controllers';
import OrbitDBAccessController from 'orbit-db-access-controllers/src/orbitdb-access-controller';

export type AccessType = 'private' | 'selfWrite'

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
      if (!options.address)
        (options as any).write = [orbitDB.identity.id];

      const ac = new MyAccessController(orbitDB, options);
      ac.subType = options.subType;
      await ac.load(options.address || options.name!);
      return ac;
    }

  /**
   * private: 仅发布者本人可读写 (或admin组)
   * selfWrite: 所有人可修改本人发布内容,admin组仍可修改所有
   */
  subType!: AccessType;

    override async canAppend(entry, identityProvider) {
      console.log(entry);
      if (await super.canAppend(entry, identityProvider)) return true;
      if (this.subType === 'private') return false;
      if (this.subType === 'selfWrite') {
        //TODO
      }
      return false;
    }

    async save() {
      return Object.assign(await super.save(), {
        subType: this.subType,
      });
    }
}
