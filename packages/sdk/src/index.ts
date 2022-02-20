// @ts-ignore
import type {Services} from '../services';
import axios from 'axios';

// @ts-ignore
export type {Services} from '../services';

/** Set this if using custom library */
export var postFunction: (url: string, body: any[]) => Promise<any> = axios.post;

export function useService<T extends keyof Services>(serviceName: T): Omit<Services[T], 'apis'> {
  return new Proxy({}, {
    get(target: {}, name: string | symbol): any {
      if (typeof name !== 'string')
        throw 'api name must be string';
      return function (...args: any[]) {
        return postFunction(`/api/${serviceName}/${name}`, args).then(it => it.data);
      };
    },
  }) as any;
}
