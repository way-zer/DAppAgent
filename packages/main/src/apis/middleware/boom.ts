import type {MiddlewareClass} from 'daruk';
import {defineMiddleware} from 'daruk';
import {boomify, isBoom} from '@hapi/boom';

@defineMiddleware('boom')
export class BoomMiddleware implements MiddlewareClass {
  initMiddleware() {
    return async (ctx, next) => {
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
      }
    };
  }
}
