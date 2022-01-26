import {api, ExposedService} from '.';
import {AppId, AppManager, AppMeta} from '/@/core/apps';
import {useApp, useAppId, useAppModifiable} from '../hooks/useApp';
import {withContext} from '/@/util/hook';
import {parseCID, toArray} from '/@/util';
import assert from 'assert';
import Boom from '@hapi/boom';
import {CoreIPFS} from '/@/core/ipfs';
import {globSource} from 'ipfs-core';

export class AppsApi extends ExposedService {
  @api()
  async thisInfo() {
    const app = await useApp();
    return {
      ...await app.appMeta.get(),
      id: app.id.toString(),
      url: app.id.url,
      modifiable: await app.canModify(),
      publicIds: (await app.publicIds()).map(it => it.toString()),
    };
  }

  @api({permission: 'apps.admin'})
  async list() {
    const list = await AppManager.list();
    return await Promise.all(list.map(async app => ({
      id: app.id.toString(),
      url: app.id.url,
      modifiable: await app.canModify(),
      publicIds: (await app.publicIds()).map(it => it.toString()),
    })));
  }

  @api({permission: 'apps.admin'})
  async info(id: string) {
    return withContext(this.thisInfo, [useAppId, AppId.fromString(id)]);
  }

  @api({permission: 'apps.admin'})
  async grantPermission(id: string, permissions: string[]) {
    const app = await withContext(useApp, [useAppId, AppId.fromString(id)]);
    for (const permission of permissions) {
      await app.grantPermission(permission);
    }
  }

  @api({permission: 'apps.admin'})
  async create(name: string) {
    const app = await AppManager.create(name);
    return withContext(this.thisInfo, [useApp, app]);
  }

  @api({permission: 'apps.admin'})
  async fork(name: string, fromApp: string) {
    const from = await withContext(useApp, [useAppId, AppId.fromString(fromApp)]);
    const app = await AppManager.create(name, from);
    return withContext(this.thisInfo, [useApp, app]);
  }

  @api({permission: 'apps.admin'})
  async updateProgram(id: string, programCid: string) {
    const app = await withContext(useAppModifiable, [useAppId, AppId.fromString(id)]);
    const program = parseCID(programCid);
    await AppManager.updateProgram(app, program);
    return true;
  }

  @api({permission: 'apps.admin'})
  async publish(id: string) {
    const app = await withContext(useAppModifiable, [useAppId, AppId.fromString(id)]);
    await AppManager.publish(app);
  }

  @api({permission: 'apps.admin'})
  async clone(id: string) {
    const appId = AppId.fromString(id);
    const app = await AppManager.clone(appId);
    return withContext(this.thisInfo, [useApp, app]);
  }

  @api({permission: 'apps.admin'})
  async delete(id: string) {
    const app = await withContext(useApp, [useAppId, AppId.fromString(id)]);
    return await AppManager.delete(app);
  }

  @api()
  async checkUpdateSelf() {
    const app = await useApp();
    return await AppManager.checkUpdate(app);
  }

  @api({permission: 'apps.admin'})
  async checkUpdate(id: string) {
    const app = await withContext(useApp, [useAppId, AppId.fromString(id)]);
    return withContext(this.checkUpdateSelf, [useApp, app]);
  }

  @api({permission: 'apps.admin'})
  async updateDesc(id: string, desc: Partial<Pick<AppMeta, 'name' | 'desc' | 'icon' | 'ext'>>) {
    const app = await withContext(useAppModifiable, [useAppId, AppId.fromString(id)]);
    const meta = await app.appMeta.get();
    const uncheck = desc as any;
    if (desc.name) {
      assert(typeof uncheck.name === 'string', Boom.badData('"name" must be string'));
      meta.name = desc.name;
    }
    if (desc.desc) {
      assert(typeof uncheck.desc === 'string', Boom.badData('"desc" must be string'));
      meta.desc = desc.desc;
    }
    if (desc.icon) {
      assert(typeof uncheck.icon === 'string', Boom.badData('"icon" must be string'));
      meta.icon = desc.icon;
    }
    if (desc.ext) {
      assert(typeof uncheck.ext === 'object', Boom.badData('"ext" must be object'));
      meta.ext = desc.ext;
    }
    await app.appMeta.set(meta);
  }

  @api({permission: 'apps.syncProgram'})
  async syncProgram(id: string, dir: string) {
    const app = await withContext(useAppModifiable, [useAppId, AppId.fromString(id)]);
    const result = await toArray(CoreIPFS.inst.addAll(globSource(dir, '**/*')));
    const cid = result.find(it => it.path === '/')?.cid;
    if (!cid)
      throw Boom.notFound('local dir not found', {dir});
    await AppManager.updateProgram(app, cid);
    await app.localData.edit({lastLocalProgramDir: dir});
    return cid.toString();
  }
}
