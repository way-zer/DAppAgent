import {AppsApi} from '/@/apis/services/apps';
import {CallApi} from '/@/apis/services/call';

export class ExposedService {
  apis: Map<string, ApiMeta>;

  constructor() {
    this.apis = Object.getPrototypeOf(this).apis || new Map();
  }
}

export function useService<T extends keyof Services>(name: T): Services[T] {
  return services[name];
}

export interface ApiMeta {
  permssion?: string;
}

export function api(meta: Partial<ApiMeta> = {}) {
  return function (target: ExposedService, propertyKey: string) {
    target.apis ||= new Map();
    target.apis.set(propertyKey, meta);
  };
}

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
};

export type Services = typeof services
