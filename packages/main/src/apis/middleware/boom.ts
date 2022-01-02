import type {DarukContext, MiddlewareClass} from 'daruk';
import {defineMiddleware} from 'daruk';
import {boomify, isBoom} from '@hapi/boom';
import config from 'config';

@defineMiddleware('boom')
export class BoomMiddleware implements MiddlewareClass {
  initMiddleware() {
    return async (ctx: DarukContext, next) => {
      try {
        await next();
      } catch (e: any) {
        if (!isBoom(e)) {
          console.error(e);
          e = boomify(e);
        }
        const {statusCode, headers, payload} = e.output;
        ctx.status = statusCode;
        for (const key in headers)
          ctx.response.headers[key] = headers[key];
        ctx.body = payload;
        if (config.main.debug)
          console.log(ctx.toJSON(), e);
      }
    };
  }
}
