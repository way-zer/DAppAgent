import {IpfsService} from '../services/ipfs'
// @ts-ignore
import {getType} from 'mime/lite'
import readable from 'it-to-stream'
import {controller, DarukContext, get, prefix, put} from 'daruk'
import {useParam} from "./hooks/simple";
import {CID} from "ipfs-core";
import Boom from "@hapi/boom";

@controller()
@prefix('/api/ipfs')
export class _Ipfs {
    @get('/status')
    async status(ctx: DarukContext) {
        ctx.body = JSON.stringify(await IpfsService.ipfsStatus(), (_, v) => (
            (typeof v === 'bigint') ? v.toString() : v
        ))
    }

    /**上传任一内容换取CID*/
    @put("/cid")
    async upload(ctx: DarukContext) {
        const ipfs = IpfsService.inst
        let body = ctx.request.body
        if(typeof body === "object")body = JSON.stringify(body)
        body = body||ctx.req // for binary
        const res = await ipfs.add({content: body}, {pin: false})
        ctx.body = {
            cid: res.cid.toString(),
            size: res.size
        }
    }
}