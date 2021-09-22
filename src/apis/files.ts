import {PrivateApp} from '../services/apps'
import {controller, DarukContext, get, post, prefix, put} from 'daruk'
import Boom from '@hapi/boom'
import {useApp} from './hooks/useApp'
import {useQuery} from './hooks/simple'
import {constants} from 'http2'

/**
 * 功能简介:
 * 列出 list
 * 新建文件夹 upload,path为/结尾
 * 新建文件 upload, body为内容
 * 删除文件 delete
 * 拷贝文件 upload, 设置from参数
 * 移动文件 upload?from + delete
 */
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
                await app.cpFile(from, path)
            } else {
                await app.uploadFile(path, ctx.req)
            }
            ctx.status = constants.HTTP_STATUS_OK
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

    @post('/delete')
    async delete(ctx: DarukContext) {
        const app = await useApp(ctx)
        const path = '/public' + useQuery(ctx, 'path')
        if (app instanceof PrivateApp) {
            await app.delFile(path)
            ctx.status = constants.HTTP_STATUS_OK
        } else
            throw Boom.badRequest('Only private apps files can modify')
    }
}