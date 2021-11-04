import { controller, DarukContext, get, priority } from 'daruk';
import readable from 'it-to-stream';
// @ts-ignore
import { getType } from 'mime/lite';
import { useApp } from './hooks/useApp';

@controller()
@priority(1)
export class _Gateway {
    resolvePath(path) {
        if (path.endsWith('/'))
            path += 'index.html'
        if (path.startsWith('/@/'))
            return path.substr(2)
        else
            return '/public' + path
    }

    @get('/(.*)')
    async get(ctx: DarukContext) {
        const app = await useApp(ctx)
        const path = this.resolvePath(ctx.path)
        ctx.type = getType(path)
        ctx.body = readable(await app.getFile(path))
    }
}