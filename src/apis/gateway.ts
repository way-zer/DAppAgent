import {App, AppService, PrivateApp} from '../services/apps'
// @ts-ignore
import {getType} from 'mime/lite'
import readable from 'it-to-stream'
import Boom from '@hapi/boom'
import {controller, DarukContext, get, inject, priority, put} from 'daruk'

@controller()
@priority(1)
export class _Gateway {
    @inject('ctx')
    ctx!: DarukContext
    @inject(AppService)
    apps!: AppService

    splitHost() {
        const headerIp = this.ctx.headers['dapp-addr']
        if (headerIp) {
            const sp = headerIp.toString().split(':')
            return {
                ending: this.ctx.host,
                type: sp[0],
                name: sp[1],
            }
        }
        const sp = this.ctx.host.split('.')
        const ending = sp.pop()
        const type = (sp.length >= 2 && sp[sp.length - 1].length < 5) ? sp.pop() : 'ipns'
        return {ending, type, name: sp.join('')}
    }

    async getApp() {
        const {name, type} = this.splitHost()
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
    async list() {
        const app = await this.getApp()
        let path = this.ctx.path
        if (path[0] !== '/') path = '/' + path
        return (await app.listFile('/public' + path)).map(file =>
            Object.assign(file, {cid: file.cid.toString()}),
        )
    }

    @put('/(.*)')
    async upload() {
        const app = await this.getApp()
        let path = this.ctx.path
        path = '/public' + path
        if (app instanceof PrivateApp) {
            let from = this.ctx.query.from
            if (from) {//move
                from = '/public' + from
                return await app.mvFile(from, path)
            }
            await app.uploadFile(path, this.ctx.req)
        } else
            throw Boom.badRequest('Only private apps files can modify')
    }

    @get('/(.*)')
    async get() {
        const app = await this.getApp()
        let path = this.ctx.path
        if (path.endsWith('/'))
            path += 'index.html'
        this.ctx.type = getType(path)
        this.ctx.body = readable(await app.getFile('/public' + path))
    }
}