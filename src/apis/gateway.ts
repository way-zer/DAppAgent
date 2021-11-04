// @ts-ignore
import { getType } from 'mime/lite'
import readable from 'it-to-stream'
import { controller, DarukContext, get, priority } from 'daruk'
import { useApp } from './hooks/useApp'
import { CID } from "ipfs-core";
import { useParam } from "./hooks/simple";
import Boom from "@hapi/boom";
import { IpfsService } from "../services/ipfs";

@controller()
@priority(1)
export class _Gateway {
    /**通过cid直接读取内容*/
    @get("/ipfs/:cid/:suffix")
    async getByCid(ctx: DarukContext) {
        let cid
        try {
            cid = CID.parse(useParam(ctx, 'cid'))
        } catch (e: any) {
            throw Boom.badRequest("invalid cid: " + e.message)
        }
        const ipfs = IpfsService.inst
        ctx.type = getType(useParam(ctx, 'suffix'))
        ctx.body = readable(ipfs.cat(cid))
    }

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