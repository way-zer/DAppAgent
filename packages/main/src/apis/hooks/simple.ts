import type {DarukContext} from 'daruk';
import {badRequest} from '@hapi/boom';

export function useParam(ctx: DarukContext, key: string): string {
  return ctx.request['params'][key];
}

export function useQuery(ctx: DarukContext, key: string): string {
  const value = ctx.query[key];
  if (!value || typeof value !== 'string')
    throw badRequest(`need query '${key}'`);
  return value;
}

export function useContext() {
  return Zone.current.get('ctx') as DarukContext;
}
