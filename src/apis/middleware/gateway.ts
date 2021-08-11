import {Context, IMidwayKoaNext, IWebMiddleware} from '@midwayjs/koa'
import {Provide, Scope, ScopeEnum} from '@midwayjs/decorator'
import {useInject} from '@midwayjs/hooks-core'
import {AppService} from '../../services/apps'

// @ts-ignore
import {getType} from 'mime/lite'
import readable from 'it-to-stream'

@Provide()
@Scope(ScopeEnum.Singleton)
export class GatewayMiddleware implements IWebMiddleware {
    resolve() {
        return async (ctx: Context, next: IMidwayKoaNext) => {
            const match = ctx.hostname.match(/(.+?)(\.ipfs)?\.(\w+)/)
            if (match == null) return next()
            return this.handle(ctx, match[1], !!match[2])
        }
    }

    async handle(ctx: Context, addr: string, ipfs: boolean) {
        const apps = await useInject(AppService)
        if (ipfs)
            addr = '/ipfs/' + addr
        let path = ctx.path
        if (path.endsWith('/') || path.length == 0)
            path += 'index.html'
        ctx.type = getType(path)
        const app = await apps.get(addr)
        ctx.body = readable(await app.getFile('/public' + path))
    }
}