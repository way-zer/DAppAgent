// @ts-ignore
import {getType} from 'mime/lite'
import readable from 'it-to-stream'
import {controller, DarukContext, get, priority} from 'daruk'
import {useApp} from './hooks/useApp'

@controller()
@priority(1)
export class _Gateway {
    @get('/(.*)')
    async get(ctx: DarukContext) {
        const app = await useApp(ctx)
        let path = ctx.path
        if (path.endsWith('/'))
            path += 'index.html'
        ctx.type = getType(path)
        ctx.body = readable(await app.getFile('/public' + path))
    }
}