import {DarukServer} from 'daruk';
import {CoreIPFS} from './core/ipfs';
import {DBManager} from './core/db';
import globalConfig from 'config';
import assert from 'assert';

export async function bootstrap() {
  const daruk = DarukServer({
    middlewareOrder: ['boom'],
  });

  const cores = import.meta.globEager('./core/**/*.ts');
  const apis = import.meta.globEager('./apis/**/*.ts');
  assert(cores && apis);

  await daruk.binding();
  await daruk.listen(globalConfig.main.port);

  setTimeout(async () => {
    await CoreIPFS.start();
    await DBManager.start();
  });
}

// export const app = bootstrap();
