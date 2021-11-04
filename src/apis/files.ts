import { controller, DarukContext, del, get, prefix, put } from 'daruk'
import { constants } from 'http2'
import { useQuery } from './hooks/simple'
import { useApp, usePrivateApp } from './hooks/useApp'

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
    resolvePath(path: string | string[]) {
        return '/public' + path
    }

    @get('list')
    async list(ctx: DarukContext) {
        const app = await useApp(ctx)
        const path = '/public' + useQuery(ctx, 'path')
        ctx.body = (await app.listFile(path)).map(file =>
            Object.assign(file, { cid: file.cid.toString() }),
        )
    }

    @put('')
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
    @del('')
    async delete(ctx: DarukContext) {
        const app = await usePrivateApp(ctx)
        const path = this.resolvePath(useQuery(ctx, 'path'))
        await app.delFile(path)
        ctx.status = constants.HTTP_STATUS_OK
    }
}