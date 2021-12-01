import type {DarukContext} from 'daruk';
import {controller, get, post, priority} from 'daruk';
import {useContext, useParam} from './hooks/simple';
import {Boom} from '../util';
import type {ApiMeta} from './services';
import {services} from './services';
import 'zone.js';
import {useApp} from './hooks/useApp';

@controller('/api')
export class _Api {
  @get('/:service/:method')
  @post('/:service/:method')
  async get(ctx: DarukContext) {
    const args = ctx.request.body || [];
    if (!Array.isArray(args))
      throw Boom.badRequest('body must be json array');
    const serviceName = useParam(ctx, 'service');
    const service = services.get(serviceName);
    if (!service)
      throw Boom.notFound('service not exist', {serviceName});
    const methodName = useParam(ctx, 'method');
    const apiMeta = service.apis.get(methodName);
    if (!apiMeta)
      throw Boom.notFound('method not exist', {serviceName, methodName});

    const result = await Zone.current.fork({
      name: 'Call Service Function',
      properties: {ctx},
    }).run(async () => {
      return this.callMethod(apiMeta, service, service[methodName], args);
    });
    ctx.body = result;
  }

    async callMethod(meta: ApiMeta, service: any, f: Function, args: any[]) {
      const app = await useApp();
      if (meta.permssion && !app.hasPermission(meta.permssion))
        throw Boom.forbidden('app not permission, request first.', {permission: meta.permssion});
      return f.call(service, ...args);
    }
}
