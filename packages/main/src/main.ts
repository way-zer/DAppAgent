import {darukContainer, DarukServer} from 'daruk';
import {CoreIPFS} from './core/ipfs';
import {DBManager} from './core/db';
import {buildInjectionModule} from 'inversify-config-binding';
import globalConfig from '../../../config';
import assert from 'assert';
import {protocol} from 'electron';
import {URL} from 'url';
import {request} from 'http';

export function beforeReady() {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'dapp',
      privileges: {//as https
        standard: true,
        secure: true,
        allowServiceWorkers: true,
        corsEnabled: true,
        supportFetchAPI: true,
        stream: true,
      },
    },
  ]);
}

export async function bootstrap() {
  const daruk = DarukServer({
    middlewareOrder: ['boom'],
  });
  darukContainer.load(buildInjectionModule(globalConfig.main, {prefix: 'config'}));

  const cores = import.meta.globEager('./core/**/*.ts');
  const apis = import.meta.globEager('./apis/**/*.ts');
  assert(cores && apis);

  await daruk.binding();
  await daruk.listen(globalConfig.main.port);
  protocol.registerStreamProtocol('dapp', (req, callback) => {
    const url = new URL(req.url);
    const req2 = request(`http://127.0.0.1:${globalConfig.main.port}${url.pathname}`, callback);
    req2.method = req.method;
    req2.setHeader('Host', new URL(req.url).hostname + '.dapp');
    req2.on('error', (err) => {
      throw err;
    });
    req2.end();
  });

  (async () => {
    await CoreIPFS.start();
    await DBManager.start();
  })().then();
}

// export const app = bootstrap();
