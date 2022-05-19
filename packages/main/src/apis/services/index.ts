import {IntegrateApi} from '/@/apis/services/integrate';
import {api, ExposedService} from './_define';
import {AppsApi} from './apps';
import {CallApi} from './call';
import {DBApi} from './db';
import {SystemApi} from './system';

export {ExposedService, api, useService} from './_define';

class TestApi extends ExposedService {
    /**
     * 接口测试Api, 固定返回
     * @return 'hello World'
     * */
    @api()
    async hello() {
        return 'hello World';
    }
}

/**
 * 所有平台接口服务的集合
 */
export const services = {
    test: new TestApi(),
    apps: new AppsApi(),
    call: new CallApi(),
    db: new DBApi(),
    system: new SystemApi(),
    integrate: new IntegrateApi(),
};

/**
 * 所有平台接口服务的类型集合
 * 使用服务请使用{@code useService}
 */
export type Services = typeof services
export type {ApiMeta} from './_define';
