import {AppId, AppManager, PrivateApp} from '/@/core/apps';
import Boom from '@hapi/boom';
import type {DarukContext} from 'daruk';
import {useContext} from './simple';

export function useAppId(ctx: DarukContext = useContext()) {
  const headerIp = ctx.headers['dapp'];
  if (headerIp) return AppId.fromString(headerIp.toString());
  const sp = ctx.host.split('.');
  sp.pop();
  const type = (sp.length >= 2 && sp[sp.length - 1].length < 5) ? sp.pop()!! : 'ipns';
  return new AppId(type, sp.join(''));
}

export async function useApp(id = useAppId()) {
  return AppManager.get(id);
}

export async function usePrivateApp(id = useAppId()): Promise<PrivateApp> {
  const app = await useApp(id);
  if (app instanceof PrivateApp)
    return app;
  throw Boom.badRequest('Require PrivateApp Only', {app});
}
