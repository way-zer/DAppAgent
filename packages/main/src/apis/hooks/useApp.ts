import {AppId, AppManager} from '/@/core/apps';
import Boom from '@hapi/boom';
import {useContext} from './simple';
import {contextHook} from '/@/util/hook';

export const useAppId = contextHook(function () {
  const ctx = useContext();
  const headerIp = ctx.headers['dapp'];
  if (headerIp) return AppId.fromString(headerIp.toString());
  const sp = ctx.host.split('.');
  sp.pop();
  const type = (sp.length >= 2 && sp[sp.length - 1].length < 5) ? sp.pop()!! : 'ipns';
  return new AppId(type, sp.join(''));
});

export const useApp = contextHook(async function () {
  const id = useAppId();
  const app = await AppManager.get(id);
  if (!app)
    throw Boom.notFound('app with id', {app: id.toString()});
  return app;
});

export async function useAppOrNull() {
  return useApp().catch(() => null);
}

export async function useAppModifiable() {
  const app = await useApp();
  if (await app.canModify())
    return app;
  throw Boom.badRequest('Require PrivateApp Only', {app});
}
