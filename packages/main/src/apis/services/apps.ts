import {api, ExposedService, useService} from '.';
import {AppId, AppManager, AppMeta} from '/@/core/apps';
import {useApp, useAppId, useAppModifiable} from '../hooks/useApp';
import {withContext} from '/@/util/hook';
import {toArray} from '/@/util';
import Boom from '@hapi/boom';
import {CoreIPFS} from '/@/core/ipfs';
import {globSource} from 'ipfs-core';
import path from 'path';
import {any, record, string} from 'superstruct';
import {assertStruct, partialObject} from '/@/apis/hooks/assertStruct';
import {AppPermission} from '/@/core/apps/define';

export class AppsApi extends ExposedService {
    /// info
    @api()
    async thisInfo() {
        const app = await useApp();
        const meta = await app.appMeta.get();
        return {
            ...meta,
            id: app.id.toString(),
            url: app.id.url,
            fork: meta.fork?.toString(),
            program: meta.program.toString(),
            modifiable: await app.canModify(),
            publicIds: (await app.publicIds()).map(it => it.toString()),
            localData: (await app.localData.get()),
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


    /// permission
    @api()
    async hasPermission(node: string) {
        const app = await useApp();
        return await app.hasPermission(node);
    }

    @api()
    async requestPermission(node: string) {
        const app = await useApp();
        if (await app.hasPermission(node)) return true;
        let meta = (await app.programMeta.get()).permissions.find(it => it.node === node);
        if (!meta)
            throw Boom.badRequest('App need to add permission to app.json first', {node});
        return await this.callRequestPermission([{...meta, optional: false}]);
    }

    @api({permission: 'apps.admin'})
    async grantPermission(id: string, permissions: string[]) {
        const app = await withContext(useApp, [useAppId, AppId.fromString(id)]);
        for (const permission of permissions) {
            await app.grantPermission(permission);
        }
    }

    //internal api for requestPermission
    async callRequestPermission(permissions: AppPermission[]): Promise<Boolean> {
        return !!(await useService('call').request('sys:admin', 'permission', {
            permissions,
        }))['granted'];
    }

    /// manage
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
        return await AppManager.delete(AppId.fromString(id));
    }

    /// update
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

    static DescStruct = partialObject({
        name: string(),
        desc: string(),
        icon: string(),
        ext: record(string(), any()),
    });

    /// desc
    /**
     * desc.ext.* null to delete key
     */
    @api()
    async updateDescSelf(desc: typeof AppsApi.DescStruct['TYPE']) {
        desc = assertStruct(AppsApi.DescStruct, desc);
        const app = await useAppModifiable();
        const meta = await app.appMeta.get();
        if (desc.ext) {
            for (const key in desc.ext) {
                if (desc.ext[key] === null)
                    delete meta.ext[key];
                else
                    meta.ext[key] = desc.ext[key];
            }
            delete desc.ext;
        }
        Object.assign(meta, desc);
        await app.appMeta.set(meta);
    }

    @api({permission: 'apps.admin'})
    async updateDesc(id: string, desc: Partial<Pick<AppMeta, 'name' | 'desc' | 'icon' | 'ext'>>) {
        await withContext(this.updateDescSelf.bind(this, desc), [useAppId, AppId.fromString(id)]);
    }

    /// util

    @api({permission: 'apps.syncProgram'})
    async syncProgram(id: string, dir: string) {
        const app = await withContext(useAppModifiable, [useAppId, AppId.fromString(id)]);
        dir = path.resolve(dir);
        const result = await toArray(CoreIPFS.inst.addAll(globSource(dir, '**/*'), {
            wrapWithDirectory: true,
            pin: false,
        }));
        const cid = result.find(it => it.path === '')?.cid;
        if (!cid)
            throw Boom.notFound('local dir not found', {dir});
        await AppManager.updateProgram(app, cid);
        await app.localData.edit({lastLocalProgramDir: dir});
        return cid.toString();
    }
}
