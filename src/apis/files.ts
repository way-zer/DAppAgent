import {controller, DarukContext, get, post, prefix, put} from 'daruk'
import {useApp, usePrivateApp} from './hooks/useApp'
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
    resolvePath(path) {
        return '/public' + path
    }

    @put('/upload')
    async upload(ctx: DarukContext) {
        const app = await usePrivateApp(ctx)
        const path = this.resolvePath(useQuery(ctx, 'path'))

        const from = ctx.query.from
        if (from) {//move
            await app.cpFile(this.resolvePath(from), path)
        } else {
            await app.uploadFile(path, ctx.req)
        }
        ctx.status = constants.HTTP_STATUS_OK
    }

    @get('/list')
    async list(ctx: DarukContext) {
        const app = await useApp(ctx)
        const path = this.resolvePath(useQuery(ctx, 'path'))
        ctx.body = (await app.listFile(path)).map(file =>
            Object.assign(file, {cid: file.cid.toString()}),
        )
    }

    @post('/delete')
    async delete(ctx: DarukContext) {
        const app = await usePrivateApp(ctx)
        const path = this.resolvePath(useQuery(ctx, 'path'))
        await app.delFile(path)
        ctx.status = constants.HTTP_STATUS_OK
    }
}