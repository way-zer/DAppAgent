import {IntegrateApi} from '/@/apis/services/integrate';
import {api, ExposedService} from './_define';
import {AppsApi} from './apps';
import {CallApi} from './call';
import {DBApi} from './db';
import {SystemApi} from './system';

export {ExposedService, api, useService} from './_define';

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
  system: new SystemApi(),
  integrate: new IntegrateApi(),
};

export type Services = typeof services
export type {ApiMeta} from './_define';
