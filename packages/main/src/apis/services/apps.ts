import {cidBase32} from '/@/util';
import {api, ExposedService} from '.';
import {AppManager} from '/@/core/apps';
import {useApp} from '../hooks/useApp';
import {CoreIPFS} from '/@/core/ipfs';
import Boom from '@hapi/boom';

export class AppsApi extends ExposedService {
  @api({permission: 'apps.admin'})
  async listPrivate() {
    const out = {} as Record<string, { cid: string, prod: string }>;
    const list = await AppManager.list();
    for (const app of list) {
      out[app.name] = {
        cid: cidBase32(await app.getCid()),
        prod: (await app.getProd()).addr,
      };
    }
    return out;
  }

  @api({permission: 'apps.admin'})
  async create(name: string) {
    await AppManager.create(name);
    return this.info(name);
  }

  static async useLocalApp(name: string) {
    const app = await AppManager.getPrivate(name);
    if (!app) throw Boom.notFound('App not found', {name});
    return app;
  }

  @api({permission: 'apps.admin'})
  async info(name: string) {
    const app = await AppsApi.useLocalApp(name);
    return {
      ...await app.getMetadata(),
      name: app.name,
      cid: cidBase32(await app.getCid()),
      prod: (await app.getProd()).addr,
    };
  }

  @api({permission: 'apps.admin'})
  async updateDesc(name: string, desc: object) {
    const app = await AppsApi.useLocalApp(name);
    await app.editMetadata({desc});
  }

  @api({permission: 'apps.admin'})
  async publish(name: string) {
    const app = await AppsApi.useLocalApp(name);
    //TODO 调用认证app
    const sign = 'Verify_Sign';
    await app.editMetadata({recordSign: sign});
    await CoreIPFS.inst.name.publish(await app.getCid(), {key: app.name});
    await app.verify();
  }

  @api()
  async thisInfo() {
    return (await useApp()).getMetadata();
  }
}
