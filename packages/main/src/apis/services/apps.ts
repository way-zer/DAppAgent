import {cidBase32} from '/@/util';
import {api, ExposedService, useService} from '.';
import {AppManager} from '/@/core/apps';
import {useApp} from '../hooks/useApp';
import {CoreIPFS} from '/@/core/ipfs';
import Boom from '@hapi/boom';
import {PeerId} from 'ipfs-core';
import {useContext} from '/@/apis/hooks/simple';

export class AppsApi extends ExposedService {
  @api({permission: 'apps.admin'})
  async listPrivate() {
    const out = {} as Record<string, { cid: string, prod: string }>;
    const list = await AppManager.list();
    for (const app of list) {
      out[app.name] = {
        cid: cidBase32(await app.getCid()),
        prod: (await app.getProd())?.addr || 'NOT_Publish',
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
      prod: (await app.getProd())?.addr || 'NOT_Publish',
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
    const peerId = CoreIPFS.libp2p.peerId;
    const appKey = await app.getKey();
    const appPeerId = await PeerId.createFromPrivKey(appKey.bytes);

    const result = await useService('call').request('sys:beian', 'appRecord', {
      cid: (await app.getCid()).toString(),
      id: appPeerId.toString(),
      appSign: await appKey.sign(appPeerId.id),
      user: peerId.toString(),
      userSign: await peerId.privKey.sign(appPeerId.id),
    }) as any;
    if (!result.sign)
      throw Boom.notAcceptable('Fail to get app Sign', {app: appPeerId.toString()});
    const sign = result.sign as string;
    await app.editMetadata({recordSign: sign});
    await CoreIPFS.inst.name.publish(await app.getCid(), {key: app.name});
    await app.verify();
  }

  @api({permission: 'apps.admin'})
  async grantPermission(id: string, permissions: string[]) {
    const app = await AppManager.getPublic(id);
    for (const permission of permissions) {
      await app.grantPermission(permission);
    }
  }

  @api()
  async thisInfo() {
    return await (await useApp()).getMetadata();
  }
}
