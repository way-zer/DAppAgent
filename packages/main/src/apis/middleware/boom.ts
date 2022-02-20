import type {DarukContext, MiddlewareClass} from 'daruk';
import {defineMiddleware} from 'daruk';
import Boom from '@hapi/boom';
import config from 'config/main.json';

@defineMiddleware('boom')
export class BoomMiddleware implements MiddlewareClass {
  initMiddleware() {
    return async (ctx: DarukContext, next) => {
      try {
        await next();
      } catch (e: any) {
        if (!Boom.isBoom(e)) {
          console.error(e);
          e = Boom.boomify(e);
        }
        const ee = e as Boom.Boom;
        const {statusCode, headers, payload} = ee.output;
        ctx.status = statusCode;
        for (const key in headers)
          ctx.response.headers[key] = headers[key];
        ctx.body = payload;
        if (!ee.isServer)
          payload.data = ee.data;
        if (config.debug)
          console.log(ctx.toJSON(), e);
      }
    };
  }
}
