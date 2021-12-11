import {AppManager, PrivateApp} from '/@/core/apps';
import Boom from '@hapi/boom';
import type {DarukContext} from 'daruk';
import {useContext} from './simple';

export function useAppId(ctx: DarukContext = useContext()) {
  const headerIp = ctx.headers['dapp'];
  if (headerIp) return headerIp.toString();
  const sp = ctx.host.split('.');sp.pop();
  const type = (sp.length >= 2 && sp[sp.length - 1].length < 5) ? sp.pop() : 'ipns';
  return `${type}:${sp.join('')}`;
}

export async function useApp(ctx: DarukContext = useContext()) {
  const id = useAppId(ctx);
  return AppManager.getPublic(id);
}

export async function usePrivateApp(ctx: DarukContext = useContext()): Promise<PrivateApp> {
  const id = useAppId(ctx);
  if (!id.startsWith('dev:'))
    throw Boom.badRequest('Only private apps files can modify');
  return AppManager.getPrivate(id.slice(4));
}
