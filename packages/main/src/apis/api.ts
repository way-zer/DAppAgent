import type {DarukContext} from 'daruk';
import {controller, options, post} from 'daruk';
import {useContext, useParam} from './hooks/simple';
import type {ApiMeta} from './services';
import {services} from './services';
import {useApp} from './hooks/useApp';
import Boom from '@hapi/boom';
import {withContext} from '/@/util/hook';

@controller('/api')
export class _Api {
  @options('/')
  async options(ctx: DarukContext) {
    ctx.status = 200;
    ctx.response.headers['Access-Control-Allow-Origin'] = ctx.request.origin;
  }

  // @get('/:service/:method')
  @post('/:service/:method')
  async get(ctx: DarukContext) {
    let args = ctx.request.body;
    if (typeof args === 'object' && Object.keys(args).length === 0) args = [];//default {}
    if (!Array.isArray(args))
      throw Boom.badRequest('body must be json array', {args});

    const serviceName = useParam(ctx, 'service');
    const service = services[serviceName];
    if (!service)
      throw Boom.notFound('service not exist', {serviceName});

    const methodName = useParam(ctx, 'method');
    const apiMeta = service.apis.get(methodName);
    if (!apiMeta)
      throw Boom.notFound('method not exist', {serviceName, methodName});

    ctx.body = await withContext(async () => {
      return await this.callMethod(apiMeta, service, service[methodName], args);
    }, [useContext, ctx]);
    ctx.status = 200;
  }

  async callMethod(meta: ApiMeta, service: any, f: Function, args: any[]) {
    if (meta.permission && !await (await useApp()).hasPermission(meta.permission))
      throw Boom.forbidden('app not permission, request first.', {permission: meta.permission});
    return f.call(service, ...args);
  }
}
