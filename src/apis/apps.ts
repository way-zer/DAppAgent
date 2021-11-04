import { AppService } from '../services/apps'
import { cidBase32 } from '../util'
import { controller, DarukContext, get, inject, post, prefix } from 'daruk'
import { notFound } from '@hapi/boom'
import { useQuery } from './hooks/simple'
import { constants } from 'http2'

@controller()
@prefix('/api/apps')
export class _Apps {
    @inject(AppService)
    apps!: AppService

    @get('list')
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

    @post('create')
    async create(ctx: DarukContext) {
        const name = useQuery(ctx, 'name')
        const app = await this.apps.create(name)
        await app.publish()
        ctx.body = await this.info(ctx)
    }

    @get('info')
    async info(ctx: DarukContext) {
        const name = useQuery(ctx, 'name')
        const app = await this.apps.get(name)
        if (!app) throw notFound('App not found', { name })
        ctx.body = Object.assign(await app.getMetadata(), {
            name,
            cid: cidBase32(await app.getCid()),
            prod: (await app.getProd()).addr,
        })
    }

    @post('publish')
    async publish(ctx: DarukContext) {
        const name = useQuery(ctx, 'name')
        const app = await this.apps.get(name)
        if (!app) throw notFound('App not found', { name })
        await app.publish()
        ctx.status = constants.HTTP_STATUS_OK
    }
}