import {App} from '/@/core/apps/app';
import {CID} from 'multiformats';
import {CoreIPFS} from '/@/core/ipfs';
import {toArray} from '/@/util';
import {AppPermission, ProgramMeta, ProgramMetaStruct} from '/@/core/apps/define';
import {AppId} from '/@/core/apps/appId';
import Boom, {forbidden} from '@hapi/boom';
import {simpleAppMeta} from '/@/core/apps/simpleApp';
import {IPFSFile} from '/@/util/ipfsFile';
import assert from 'assert';
import {DBManager} from '/@/core/db';
import {useService} from '/@/apis/services';
import PeerId from 'peer-id';
import {withContext} from '/@/util/hook';
import {useAppId} from '/@/apis/hooks/useApp';
import {assertStruct} from '/@/apis/hooks/assertStruct';
import config from '/@/config';
import {onceF} from '/@/util/async';

export class AppManager {
    private static _list?: App[];

    @onceF
    static async list() {
        if (this._list) return this._list;
        await CoreIPFS.inst.files.mkdir('/apps').catch(() => undefined);
        return this._list = (await toArray(CoreIPFS.inst.files.ls('/apps')))
            .filter(it => it.type == 'directory')
            .map(file => (new App(AppId.fromString(file.name))));
    }

    static async get(id: AppId, load = true) {
        let app = (await this.list()).find(it => it.id.equals(id));
        if (load && !app && id.type === 'sys') {
            console.log('System app ' + id + ' not found, try clone');
            app = await this.clone(id);
        }

        if (load && app) {
            if ((Date.now() - (await app.localData.get()).lastCheckUpdate || 0) > config.app.updateInterval * 1000) {
                try {
                    await this.checkUpdate(app);
                } catch (e) {
                    console.warn(`Fail to auto update for ${app.id}`, e);
                }
            }
            await app.loadProgram();
        }
        return app;
    }

    //actions
    //未clone使用AppId表示,已完成clone用App表示
    /**
     * 创建新应用,后需updateProgram,publish
     * @param name app本地名
     * @param from when fork
     */
    static async create(name: string, from?: App): Promise<App> {
        const id = new AppId('dev', name);
        if (await this.get(id) != null)
            throw Boom.conflict('App exists', {name});

        const app = new App(id);
        const key = await PeerId.create({keyType: 'Ed25519'});

        const meta = await simpleAppMeta();
        meta.id = key.toB58String();
        if (from) meta.fork = await from.appMeta.file.cid();
        await app.appMeta.set(meta);
        await app.privateKeyFile.write(key.marshal());

        await app.localData.set({
            firstUse: Date.now(),
            lastUse: Date.now(),
            permissions: {},
            lastCheckUpdate: Date.now(),
        });

        if (from) {
            await from.loadProgram();
            await this.updateProgram(app, from.programCID);
        }
        this._list!!.push(app);//must init after get
        return app;
    }

    /**更新应用代码,Need CanModify*/
    static async updateProgram(app: App, program: CID) {
        if (!await app.canModify())
            throw Boom.forbidden('Can\'t modify app', {app: app.id.toString()});

        //检查配置文件
        const meta = await new IPFSFile(`/ipfs/${program}/app.json`).asJsonConfig<ProgramMeta>().get();
        assertStruct(ProgramMetaStruct, meta);

        //补全数据库
        const appMeta = await app.appMeta.get();
        const dbs = new Set<string>();//check duplicate
        for (const dbInfo of meta.databases) {
            assert(!dbs.has(dbInfo.name), Boom.badData('duplicate database definition', {program, db: dbInfo.name}));
            dbs.add(dbInfo.name);
            if (dbInfo.name in appMeta.databases) continue;
            appMeta.databases[dbInfo.name] = await DBManager.create({
                ...dbInfo,
                name: program + dbInfo.name,
            });
        }

        if (!program.equals(app.programCID)) {
            appMeta.updated = Date.now();
            appMeta.program = program;
            await app.appMeta.set(appMeta);
            await app.loadProgram(true);
        }

        //检查授权
        let permissions = [] as AppPermission[];
        let newNeed = false;
        for (let permission of meta.permissions) {
            if (!await app.hasPermission(permission.node)) {
                permissions.push(permission);
                if (!permission.optional) newNeed = true;
            }
        }
        if (newNeed)
            await withContext(async () => {
                await useService('apps').callRequestPermission(permissions).catch(console.warn);
            }, [useAppId, app.id]);//fixme, can't transmit useApp
    }

    /**发布应用,Need CanModify*/
    static async publish(app: App) {
        if (!await app.canModify())
            throw Boom.forbidden('Can\'t modify app', {app: app.id.toString()});

        //获取recordSign
        await app.appMeta.edit({
            recordSign: await useService('integrate').appRecord(app),
        });

        //更新IPNS
        await app.publishIPNS();
    }

    /**克隆App到本地*/
    static async clone(id: AppId): Promise<App> {
        if (await this.get(id, false) != null)
            throw Boom.conflict('App exists', {app: id.toString()});
        const addr = await id.resolve();
        if (!addr)
            throw Boom.notFound('Can\'t resolve addr', {app: id.toString()});
        const app = new App(id);
        await app.appMeta.file.cpFrom(addr);
        await app.localData.set({
            firstUse: Date.now(),
            lastUse: Date.now(),
            permissions: {},
            lastCheckUpdate: Date.now(),
        });
        if (!await app.verify())
            throw forbidden('App not verify', {app: id.toString()});
        await app.loadProgram();
        this._list!!.push(app);//must init after get
        return app;
    }

    static async checkUpdate(app: App) {
        if (!app.id.needUpdate) return false;
        const addr = await app.id.resolve();
        const old = await app.appMeta.file.cid();
        let ok = false;
        if (addr && !old.equals(addr)) {
            const oldMeta = await app.appMeta.get();
            await app.appMeta.file.cpFrom(addr);
            app.appMeta.invalidCache();
            try {
                const newTime = (await app.appMeta.get()).updated;
                if (newTime < oldMeta.updated) {
                    await app.localData.edit({lastCheckUpdate: Date.now()});
                    // noinspection ExceptionCaughtLocallyJS
                    throw Boom.conflict('New Version is older than now', {
                        app: app.id.toString(), nowTime: oldMeta.updated, newTime,
                    });
                }

                if (!await app.verify()) {
                    // noinspection ExceptionCaughtLocallyJS
                    throw Boom.forbidden('App not verify', {app: app.id.toString(), newAddr: addr.toString()});
                }
                ok = true;
            } finally {
                if (!ok) {
                    await app.appMeta.file.cpFrom(old);
                    app.appMeta.invalidCache();
                }
                await app.loadProgram(true);
            }
        }
        await app.localData.edit({lastCheckUpdate: Date.now()});
        return ok;
    }

    static async delete(id: AppId) {
        const i = (await this.list()).findIndex(it => it.id.equals(id));
        if (i >= 0) {
            const app = this._list!!.splice(i)[0];
            await CoreIPFS.inst.files.rm(app.appRoot, {recursive: true});
            return true;
        }
        return false;
    }

    static startRepublish() {
        setInterval(async () => {
            const apps = await this.list();
            for (const app of apps) {
                if (await app.canModify())
                    await app.publishIPNS();
            }
        }, 4 * 60 * 60 * 1000);
    }
}
