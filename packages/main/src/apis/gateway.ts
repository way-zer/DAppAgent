import type {DarukContext} from 'daruk';
import {controller, get, post, priority} from 'daruk';
import readable from 'it-to-stream';
// @ts-ignore
import {getType} from 'mime/lite';
import {CoreIPFS} from '../core/ipfs';
import {useContext, useParam} from './hooks/simple';
import {useApp} from './hooks/useApp';
import {parseCID} from '/@/util';
import {withContext} from '/@/util/hook';

@controller()
@priority(1)
export class _Gateway {
  resolvePath(path) {
    if (path.endsWith('/'))
      path += 'index.html';
    if (path.startsWith('/@/'))
      return path.substring(2);
    else
      return '/public' + path;
  }

  @get('/(.*)')
  async get(ctx: DarukContext) {
    const app = await withContext(useApp, [useContext, ctx]);
    const path = this.resolvePath(ctx.path);
    ctx.type = getType(path);
    ctx.body = readable(await app.getFile(path));
  }

  /**上传任一内容换取CID*/
  @post('/ipfs/upload')
  async upload(ctx: DarukContext) {
    const ipfs = CoreIPFS.inst;
    let body = ctx.request.body;
    if (typeof body === 'object') body = JSON.stringify(body);
    body = body || ctx.req; // for binary
    const res = await ipfs.add({content: body}, {pin: false});
    ctx.body = {
      cid: res.cid.toString(),
      size: res.size,
    };
  }

  /**通过cid直接读取内容*/
  @get('/ipfs/:cid/:suffix')
  async getByCid(ctx: DarukContext) {
    const cid = parseCID(useParam(ctx, 'cid'));
    ctx.type = getType(useParam(ctx, 'suffix'));
    ctx.body = readable(CoreIPFS.inst.cat(cid));
  }
}
