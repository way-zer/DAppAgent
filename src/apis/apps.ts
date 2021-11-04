import Boom from '@hapi/boom'
import { controller, DarukContext, get, inject, post, prefix, put, validate } from 'daruk'
import { constants } from 'http2'
import { DataBase } from 'src/services/db'
import { AppService, PrivateApp } from '../services/apps'
import { cidBase32 } from '../util'
import { useParam, useQuery } from './hooks/simple'
import { useApp, usePrivateApp } from './hooks/useApp'

@controller()
@prefix('/api/apps')
export class _Apps {
    @inject(AppService)
    apps!: AppService

    @get('')
    async list(ctx: DarukContext) {
        const out = {}
        const list = await this.apps.list()
        for (const app of list) {
            out[app.name] = {
                cid: cidBase32(await app.getCid()),
                prod: (await app.getProd()).addr,
            }
        }
        ctx.body = out
    }

    @post('')
    async create(ctx: DarukContext) {
        const name = useQuery(ctx, 'name')
        const app = await this.apps.create(name)
        await app.publish()
        ctx.body = await this.getInfo(app)
    }

    async useLocalApp(ctx: DarukContext): Promise<PrivateApp> {
        const name = useParam(ctx, 'name')
        const app = await this.apps.get(name)
        if (!app) throw Boom.notFound('App not found', { name })
        return app
    }

    @put(':name/desc')
    async updateDesc(ctx: DarukContext) {
        if (typeof ctx.request.body !== 'object')
            throw Boom.badRequest("invalid body, need object", { body: ctx.request.body })
        const app = await this.useLocalApp(ctx)
        await app.editMetadata({ desc: ctx.request.body })
    }

    @post(':name/publish')
    async publish(ctx: DarukContext) {
        const app = await this.useLocalApp(ctx)
        await app.publish()
        ctx.status = constants.HTTP_STATUS_OK
    }

    async getInfo(app: PrivateApp){
        return Object.assign(await app.getMetadata(), {
            name: app.name,
            cid: cidBase32(await app.getCid()),
            prod: (await app.getProd()).addr,
        })
    }

    @get(':name/info')
    async info(ctx: DarukContext) {
        const app = await this.useLocalApp(ctx)
        ctx.body = this.getInfo(app)
    }

    @get("thisInfo")
    async appInfo(ctx: DarukContext) {
        const app = await useApp(ctx)
        ctx.body = app.getMetadata()
    }
}