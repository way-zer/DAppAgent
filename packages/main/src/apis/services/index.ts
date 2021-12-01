interface ExposedService {
    apis: Map<string, ApiMeta>
    name: string
}

export interface ApiMeta {
    permssion?: string
}

export const services = new Map<string, ExposedService>();
export function useService<T>(ctor: new () => T): T & ExposedService {
  return services[ctor.prototype.serviceName];
}

export function exposedService(name: string) {
  return function <T extends new () => C, C>(target: T): T {
    Object.getPrototypeOf(target).serviceName = name;
    const inst = new target();
    services.set(name, Object.assign(inst, {
      apis: Object.getPrototypeOf(inst).apis,
      name,
    }));
    return target;
  };
}

export function api(meta: Partial<ApiMeta> = {}) {
  return function (target: any, propertyKey: string) {
    target.apis ||= new Map();
    target.apis.set(propertyKey, meta);
  };
}

@exposedService('test')
class Test {
    @api()
    async hello() {
      return 'hello World';
    }
}
