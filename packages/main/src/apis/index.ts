import {DarukServer} from 'daruk';
import assert from 'assert';
import globalConfig from 'config/main.json';

export const Apis = {
  async start() {
    const daruk = DarukServer({
      middlewareOrder: ['boom'],
    });

    // const cores = import.meta.globEager('./core/**/*.ts');
    const apis = import.meta.globEager('./**/*.ts');
    assert(apis);

    await daruk.binding();
    await daruk.listen(globalConfig.port);
  },
};
