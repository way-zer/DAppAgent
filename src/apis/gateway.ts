import {App, AppService, PrivateApp} from '../services/apps'
// @ts-ignore
import {getType} from 'mime/lite'
import readable from 'it-to-stream'
import Boom from '@hapi/boom'
import {controller, DarukContext, get, inject, priority, put} from 'daruk'

@controller()
@priority(1)
export class _Gateway {
    @inject(AppService)
    apps!: AppService

    splitHost(ctx: DarukContext) {
        const headerIp = ctx.headers['dapp-addr']
        if (headerIp) {
            const sp = headerIp.toString().split(':')
            return {
                ending: ctx.host,
                type: sp[0],
                name: sp[1],
            }
        }
        const sp = ctx.host.split('.')
        const ending = sp.pop()
        const type = (sp.length >= 2 && sp[sp.length - 1].length < 5) ? sp.pop() : 'ipns'
        return {ending, type, name: sp.join('')}
    }

    async getApp(ctx: DarukContext) {
        const {name, type} = this.splitHost(ctx)
        let out: App | null = null
        try {
            switch (type) {
                case 'ipns':
                    out = await this.apps.getPublic(`/ipns/${name}`)
                    break
                case 'ipfs':
                    out = await this.apps.getPublic(`/ipfs/${name}`, false)
                    break
                case 'dev':
                    out = await this.apps.get(name)
                    break
                case 'sys':
                    throw Boom.notImplemented()
            }
        } catch (e) {
        }
        if (out === null)
            throw Boom.notFound()
        return out
    }

    @get('/@list')
    async list(ctx: DarukContext) {
        const app = await this.getApp(ctx)
        let path = ctx.path
        if (path[0] !== '/') path = '/' + path
        return (await app.listFile('/public' + path)).map(file =>
            Object.assign(file, {cid: file.cid.toString()}),
        )
    }

    @put('/(.*)')
    async upload(ctx: DarukContext) {
        const app = await this.getApp(ctx)
        let path = ctx.path
        path = '/public' + path
        if (app instanceof PrivateApp) {
            let from = ctx.query.from
            if (from) {//move
                from = '/public' + from
                return await app.mvFile(from, path)
            }
            await app.uploadFile(path, ctx.req)
        } else
            throw Boom.badRequest('Only private apps files can modify')
    }

    @get('/(.*)')
    async get(ctx: DarukContext) {
        const app = await this.getApp(ctx)
        let path = ctx.path
        if (path.endsWith('/'))
            path += 'index.html'
        ctx.type = getType(path)
        ctx.body = readable(await app.getFile('/public' + path))
    }
}