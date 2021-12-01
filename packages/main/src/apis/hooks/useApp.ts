import type {App} from '../../core/apps';
import {AppManager, PrivateApp} from '../../core/apps';
import Boom from '@hapi/boom';
import type {DarukContext} from 'daruk';
import {useContext} from './simple';

export function splitHost(ctx: DarukContext = useContext()) {
  const headerIp = ctx.headers['dapp-addr'];
  if (headerIp) {
    const sp = headerIp.toString().split(':');
    return {
      ending: ctx.host,
      type: sp[0],
      name: sp[1],
    };
  }
  const sp = ctx.host.split('.');
  const ending = sp.pop();
  const type = (sp.length >= 2 && sp[sp.length - 1].length < 5) ? sp.pop() : 'ipns';
  return {ending, type, name: sp.join('')};
}

export async function useApp(ctx: DarukContext = useContext()) {
  const {name, type} = splitHost(ctx);
  let out: App | null = null;
  try {
    switch (type) {
      case 'ipns':
        out = await AppManager.getPublic(`/ipns/${name}`);
        break;
      case 'ipfs':
        out = await AppManager.getPublic(`/ipfs/${name}`, false);
        break;
      case 'dev':
        out = await AppManager.get(name);
        break;
      case 'sys':
        throw Boom.notImplemented();
    }
  } catch (e) {
  }
  if (out === null)
    throw Boom.notFound(`Can find app with ${type}:${name}`);
  return out;
}

export async function usePrivateApp(ctx: DarukContext = useContext()): Promise<PrivateApp> {
  const app = await useApp(ctx);
  if (app instanceof PrivateApp)
    return app;
  throw Boom.badRequest('Only private apps files can modify');
}
