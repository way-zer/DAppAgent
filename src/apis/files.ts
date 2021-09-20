import {PrivateApp} from '../services/apps'
import {controller, DarukContext, get, prefix, put} from 'daruk'
import Boom from '@hapi/boom'
import {useApp} from './hooks/useApp'
import {useQuery} from './hooks/simple'
import {constants} from 'http2'

@controller()
@prefix('/api/file')
export class _Files {
    @put('/upload')
    async upload(ctx: DarukContext) {
        const app = await useApp(ctx)
        const path = '/public' + useQuery(ctx, 'path')
        if (app instanceof PrivateApp) {
            let from = ctx.query.from
            if (from) {//move
                from = '/public' + from
                return await app.mvFile(from, path)
            }
            await app.uploadFile(path, ctx.req)
            ctx.status = constants.HTTP_STATUS_ACCEPTED
        } else
            throw Boom.badRequest('Only private apps files can modify')
    }

    @get('/list')
    async list(ctx: DarukContext) {
        const app = await useApp(ctx)
        const path = '/public' + useQuery(ctx, 'path')
        ctx.body = (await app.listFile(path)).map(file =>
            Object.assign(file, {cid: file.cid.toString()}),
        )
    }
}