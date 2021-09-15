// @ts-ignore
import {getType} from 'mime/lite'
import readable from 'it-to-stream'
import {controller, DarukContext, get, priority} from 'daruk'
import {useApp} from './hooks/useApp'
import proxy from 'koa-better-http-proxy'
import {boomify} from '@hapi/boom'
import {constants} from 'http2'

@controller()
@priority(1)
export class _Gateway {
    @get('/(.*)')
    async get(ctx: DarukContext) {
        const app = await useApp(ctx)
        const devPort = ctx.host.split(':')[1]
        if (devPort) {
            //forward to frontend dev server
            try {
                return await proxy('localhost:' + devPort, {})(ctx, Promise.resolve)
            } catch (e) {
                throw boomify(e, {
                    statusCode: constants.HTTP_STATUS_BAD_GATEWAY,
                })
            }
        }
        let path = ctx.path
        if (path.endsWith('/'))
            path += 'index.html'
        ctx.type = getType(path)
        ctx.body = readable(await app.getFile('/public' + path))
    }
}