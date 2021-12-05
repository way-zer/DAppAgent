import type {DarukContext} from 'daruk';
import {controller, get, post} from 'daruk';
import {useParam} from './hooks/simple';
import type {ApiMeta} from './services';
import {services} from './services';
import 'zone.js';
import {useApp} from './hooks/useApp';
import Boom from '@hapi/boom';

@controller('/api')
export class _Api {
  @get('/:service/:method')
  @post('/:service/:method')
  async get(ctx: DarukContext) {
    const args = ctx.request.method === 'GET' ? [] : ctx.request.body;
    if (!Array.isArray(args))
      throw Boom.badRequest('body must be json array');
    const serviceName = useParam(ctx, 'service');
    const service = services[serviceName];
    if (!service)
      throw Boom.notFound('service not exist', {serviceName});
    const methodName = useParam(ctx, 'method');
    const apiMeta = service.apis.get(methodName);
    if (!apiMeta)
      throw Boom.notFound('method not exist', {serviceName, methodName});

    ctx.body = await Zone.current.fork({
      name: 'Call Service Function',
      properties: {ctx},
    }).run(async () => {
      return this.callMethod(apiMeta, service, service[methodName], args);
    });
  }

  async callMethod(meta: ApiMeta, service: any, f: Function, args: any[]) {
    if (meta.permission && !(await useApp()).hasPermission(meta.permission))
      throw Boom.forbidden('app not permission, request first.', {permission: meta.permission});
    return f.call(service, ...args);
  }
}
