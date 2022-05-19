import {api, ExposedService, useService} from '.';
import {AppId, AppLocalMeta, AppManager, AppMeta, ProgramMeta} from '/@/core/apps';
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
import PeerId from 'peer-id';

export type AppInfo = Omit<AppMeta, 'fork' | 'program'> & {
    fork?: string,
    program: ProgramMeta & { cid: string }
} & {
    id: string,
    uniqueId: string
    url: string
    modifiable: boolean
    publicIds: string[],
    localData: AppLocalMeta
}

/**
 * 应用管理接口
 * 普通应用可用 {@code thisInfo} {@code hasPermission} {@code requestPermission} {@code checkUpdateSelf} {@code updateDescSelf}
 * 其他供特权应用管理使用
 */
export class AppsApi extends ExposedService {
    /// info
    /**
     * 获取当前应用的详细信息
     * 包含
     * * 应用的id，名字，介绍，图标，链接等基础信息
     *   其中`name` `desc` `icon` `ext`会和程序元数据合并
     * * 程序的元数据信息：作者，数据库，服务等
     * * 本地的内部数据：权限，访问时间等
     * 具体内容见返回的数据结构
     */
    @api()
    async thisInfo() {
        const app = await useApp();
        const meta = await app.appMeta.get();
        const programMeta = await app.programMeta.get();
        return {
            ...meta,
            name: meta.name || programMeta.name,
            desc: meta.desc || programMeta.desc,
            icon: meta.icon || programMeta.icon,
            ext: {...programMeta.ext, ...meta.ext},
            id: app.id.toString(),
            uniqueId: app.uniqueId,
            url: app.id.url,
            fork: meta.fork?.toString(),
            modifiable: await app.canModify(),
            publicIds: (await app.publicIds()).map(it => it.toString()),
            localData: (await app.localData.get()),
            program: {
                ...programMeta,
                cid: meta.program.toString(),
            },
        } as AppInfo;
    }

    /**
     * 管理接口：列出当前所有应用
     */
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

    /**
     * 管理接口：获取指定应用信息
     */
    @api({permission: 'apps.admin'})
    async info(id: string) {
        return withContext(this.thisInfo, [useAppId, AppId.fromString(id)]);
    }


    /// permission
    /**
     * 判断当前应用是否具有某个权限
     * 没有权限可调用{@code requestPermission}请求授权
     */
    @api()
    async hasPermission(node: string) {
        const app = await useApp();
        return await app.hasPermission(node);
    }

    /**
     * 请求授权
     * 权限必须在应用元数据中有注明
     *
     * 该接口可能会弹窗请求用户确认，具有较长耗时，也可能请求超时，可能需要重试
     * 已授权会立刻返回
     */
    @api()
    async requestPermission(node: string) {
        const app = await useApp();
        if (await app.hasPermission(node)) return true;
        let meta = (await app.programMeta.get()).permissions.find(it => it.node === node);
        if (!meta)
            throw Boom.badRequest('App need to add permission to app.json first', {node});
        return await this.callRequestPermission([{...meta, optional: false}]);
    }

    /**
     * 管理接口：授予指定应用指定权限
     */
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
    /**
     * 管理接口：创建一个新的本地开发应用
     */
    @api({permission: 'apps.admin'})
    async create(name: string) {
        const app = await AppManager.create(name);
        return withContext(this.thisInfo, [useApp, app]);
    }

    /**
     * 管理接口：fork一个应用成本地开发应用
     */
    @api({permission: 'apps.admin'})
    async fork(name: string, fromApp: string) {
        const from = await withContext(useApp, [useAppId, AppId.fromString(fromApp)]);
        const app = await AppManager.create(name, from);
        return withContext(this.thisInfo, [useApp, app]);
    }

    /**
     * 管理接口：发布一个本地开发应用
     */
    @api({permission: 'apps.admin'})
    async publish(id: string) {
        const app = await withContext(useAppModifiable, [useAppId, AppId.fromString(id)]);
        await AppManager.publish(app);
    }

    /**
     * 管理接口：通过一个给定地址，下载一个应用
     */
    @api({permission: 'apps.admin'})
    async clone(id: string) {
        const appId = AppId.fromString(id);
        const app = await AppManager.clone(appId);
        return withContext(this.thisInfo, [useApp, app]);
    }

    /**
     * 管理接口：删除一个应用
     */
    @api({permission: 'apps.admin'})
    async delete(id: string) {
        return await AppManager.delete(AppId.fromString(id));
    }

    /**
     * 检测更新
     * 如果有更新，该接口会立刻更新应用
     * @return boolean 有更新，前端应该主动刷新页面使用新版本
     */
    /// update
    @api()
    async checkUpdateSelf() {
        const app = await useApp();
        return await AppManager.checkUpdate(app);
    }

    /**
     * 管理接口：检测指定应用更新
     * @see checkUpdateSelf
     */
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
     * 更新当前应用信息
     * 包括应用`name` `desc` `icon` `ext`
     */
    @api()
    async updateDescSelf(desc: typeof AppsApi.DescStruct['TYPE']) {
        desc = assertStruct(AppsApi.DescStruct, desc);
        const app = await useAppModifiable();
        const meta = await app.appMeta.get();
        const programMeta = await app.programMeta.get();
        if (desc.ext) {
            for (const key in desc.ext) {
                if (desc.ext[key] === null || desc.ext[key] === programMeta.ext[key])
                    delete meta.ext[key];
                else
                    meta.ext[key] = desc.ext[key];
            }
            delete desc.ext;
        }
        for (const key in desc) {
            if (desc[key] == programMeta[key]) {
                delete desc[key];
                delete meta[key];
            }
        }
        Object.assign(meta, desc);
        await app.appMeta.set(meta);
    }

    /**
     * 管理接口：更新指定应用信息
     * @see updateDescSelf
     */
    @api({permission: 'apps.admin'})
    async updateDesc(id: string, desc: Partial<Pick<AppMeta, 'name' | 'desc' | 'icon' | 'ext'>>) {
        await withContext(this.updateDescSelf.bind(this, desc), [useAppId, AppId.fromString(id)]);
    }

    /// util
    /**
     * 管理接口：导入密钥
     * 导入密钥后，将具有应用所有者的身份
     */
    @api({permission: 'apps.admin'})
    async importKey(id: string, key0: PeerId.JSONPeerId) {
        const app = await withContext(useApp, [useAppId, AppId.fromString(id)]);
        if (await app.canModify())
            throw Boom.badRequest('App already have key', {id});
        const key = await PeerId.createFromJSON(key0);
        if (app.uniqueId && app.uniqueId !== key.toB58String())
            throw Boom.badRequest('Key not match this app', {id, expect: app.uniqueId, get: key.toB58String()});
        if (!key.privKey)
            throw Boom.badRequest('Key must include private', {id, key: key0});
        await app.privateKeyFile.write(key.marshal());
        if (!app.uniqueId) {
            await app.appMeta.edit({id: key.toB58String()});
            await app.loadProgram(true);//reload uniqueId
        }
    }

    /**
     * 管理接口：更新应用的程序
     * 更新应用的代码
     */
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
