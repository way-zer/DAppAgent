import {services, Services} from '/@/apis/services/index';

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
  permission?: string;
}

export function api(meta: Partial<ApiMeta> = {}) {
  return function (target: ExposedService, propertyKey: string) {
    target.apis ||= new Map();
    target.apis.set(propertyKey, meta);
  };
}
