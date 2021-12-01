// noinspection JSUnusedLocalSymbols,JSUnusedGlobalSymbols

import {darukContainer, DarukServer} from 'daruk';
import {CoreIPFS} from './core/ipfs';
import {DBManager} from './core/db';
import {buildInjectionModule} from 'inversify-config-binding';
import globalConfig from '../../../config';
import assert from 'assert';

export async function bootstrap() {
  const daruk = DarukServer({
    middlewareOrder: ['boom'],
  });
  darukContainer.load(buildInjectionModule(globalConfig.main, {prefix: 'config'}));
  if (import.meta.env?.BASE_URL) {
    const cores = import.meta.globEager('./core/**/*.ts');
    const apis = import.meta.globEager('./apis/**/*.ts');
    assert(cores && apis);
  } else {
    await daruk.loadFile('core');
    await daruk.loadFile('apis');
  }

  await daruk.binding();
  await daruk.listen(7001);

  (async () => {
    await CoreIPFS.start();
    await DBManager.start();
  })().then();
}

// export const app = bootstrap();
