export {ExposedService, api, useService} from './_define';
import {api, ExposedService} from './_define';
import {AppsApi} from './apps';
import {CallApi} from './call';
import {DBApi} from './db';
import {FileApi} from './file';
import {SystemApi} from './system';

class TestApi extends ExposedService {
  @api()
  async hello() {
    return 'hello World';
  }
}

export const services = {
  test: new TestApi(),
  apps: new AppsApi(),
  call: new CallApi(),
  db: new DBApi(),
  file: new FileApi(),
  system: new SystemApi(),
};

export type Services = typeof services
export type {ApiMeta} from './_define';
