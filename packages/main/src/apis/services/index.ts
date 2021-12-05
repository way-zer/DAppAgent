export {ExposedService, api, useService} from './_define';
import {api, ExposedService} from './_define';
import {AppsApi} from '/@/apis/services/apps';
import {CallApi} from '/@/apis/services/call';
import {DBApi} from '/@/apis/services/db';
import {FileApi} from '/@/apis/services/file';
import {SystemApi} from '/@/apis/services/system';

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
