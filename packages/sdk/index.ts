// @ts-ignore
import type {Services} from './services';
import axios, {AxiosRequestConfig} from 'axios';

// @ts-ignore
export type {Services} from './services';

/**
 * 引用接口的返回类型
 */
export type ServiceReturn<Service extends keyof Services, F extends keyof Services[Service]> =
    Services[Service][F] extends (...args: any) => Promise<infer R> ? R : never

/**
 * 调用平台接口
 */
export function useService<T extends keyof Services>(serviceName: T, axiosConfig?: AxiosRequestConfig<any[]>): Omit<Services[T], 'apis'> {
    return new Proxy({}, {
        get(target: {}, name: string | symbol): any {
            if (typeof name !== 'string')
                throw 'api name must be string';
            return function (...args: any[]) {
                return axios.post(`/api/${serviceName}/${name}`, args, axiosConfig).then(it => it.data);
            };
        },
    }) as any;
}

/**
 * 上传文件到接口
 * @return 文件链接 例如'/ipfs/xxxxx?abc.png'
 */
export async function ipfsUploadFile(file: File, onUploadProgress?: (e: ProgressEvent) => void): Promise<string> {
    console.debug('Upload ' + file + ' to ipfs');
    const result = await axios.post('/ipfs/upload', file, {
        headers: {
            'content-type': 'application/octet-stream',
        },
        onUploadProgress,
    });
    const url = `/ipfs/${result.data.cid}?${encodeURI(file.name)}`;
    console.debug(`End upload ${url}`);
    return url;
}