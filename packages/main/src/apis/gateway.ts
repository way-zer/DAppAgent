import type {DarukContext} from 'daruk';
import {controller, get, post, priority} from 'daruk';
import readable from 'it-to-stream';
import {getType} from 'mime/lite';
import {CoreIPFS} from '../core/ipfs';
import {useContext, useParam} from './hooks/simple';
import {useApp} from './hooks/useApp';
import {withContext} from '/@/util/hook';
import Boom from '@hapi/boom';

@controller()
@priority(1)
export class _Gateway {
    /**通过cid直接读取内容*/
    @get('/ipfs/:cidPath(.*)')
    async getByCid(ctx: DarukContext) {
        const path = '/ipfs/' + useParam(ctx, 'cidPath');
        try {
            const stat = await CoreIPFS.inst.files.stat(path);
            if (stat.type == 'directory')
                // noinspection ExceptionCaughtLocallyJS
                throw path + ' is a directory.';
        } catch (e: any) {
            throw Boom.badRequest(e.message || e?.toString());
        }
        ctx.type = getType(ctx.querystring || 'index.html');
        ctx.body = readable(CoreIPFS.inst.cat(path));
    }

    /**上传任一内容换取CID*/
    @post('/ipfs/upload')
    async upload(ctx: DarukContext) {
        const ipfs = CoreIPFS.inst;
        let body = ctx.request.body;
        if (ctx.request.type == 'application/octet-stream')
            body = ctx.req;
        else if (typeof body === 'object') body = JSON.stringify(body);
        const res = await ipfs.add({content: body}, {pin: false});
        ctx.body = {
            cid: res.cid.toString(),
            size: res.size,
        };
    }

    @get('/(.*)')
    async get(ctx: DarukContext) {
        const app = await withContext(useApp, [useContext, ctx]);
        let path = ctx.path;
        if (path.endsWith('/'))
            path += 'index.html';
        try {
            ctx.body = readable(await app.getFile(path));
            ctx.type = getType(path);
        } catch (e) {
            if (!(await app.programMeta.get()).singlePageApp) throw e;
            ctx.body = readable(await app.getFile('/index.html'));
            ctx.type = getType('index.html');
        }
    }
}
