import Boom from "@hapi/boom";
import { controller, DarukContext, get, post, priority, put } from 'daruk';
import { CID } from "ipfs-core";
import readable from 'it-to-stream';
// @ts-ignore
import { getType } from 'mime/lite';
import { IpfsService } from "../services/ipfs";
import { useParam } from "./hooks/simple";

@controller()
@priority(1)
export class _CID {
    /**上传任一内容换取CID*/
    @post("/ipfs/upload")
    async upload(ctx: DarukContext) {
        const ipfs = IpfsService.inst
        let body = ctx.request.body
        if (typeof body === "object") body = JSON.stringify(body)
        body = body || ctx.req // for binary
        const res = await ipfs.add({ content: body }, { pin: false })
        ctx.body = {
            cid: res.cid.toString(),
            size: res.size
        }
    }
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
}