import type {DarukContext} from 'daruk';
import Boom, {badRequest} from '@hapi/boom';
import {contextHook} from '/@/util/hook';

export function useParam(ctx: DarukContext, key: string): string {
  return ctx.request['params'][key];
}

export function useQuery(ctx: DarukContext, key: string): string {
  const value = ctx.query[key];
  if (!value || typeof value !== 'string')
    throw badRequest(`need query '${key}'`);
  return value;
}

export const useContext = contextHook(function (): DarukContext {
  //use withContext to provide
  throw Boom.badRequest('No DarukContext in context');
});
