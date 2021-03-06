import {api, ExposedService} from '/@/apis/services/index';
import Boom from '@hapi/boom';
import {useApp, useAppId} from '/@/apis/hooks/useApp';
import {randomUUID} from 'crypto';
import {AppId} from '/@/core/apps';
import {ElectronHelper} from '/@/core/electron';
import {withContext} from '/@/util/hook';
import {WatchDog} from '/@/util/watchDog';

/**
 * 跨应用调用接口
 * 本服务提供了一个跨应用进行接口调用的方法
 * 被调用方需要先在原数据上声明服务
 * 调用方通过{@code request}请求服务
 * 被调用方通过{@code respond}返回处理结果。
 *   如处理时间较长，可以使用{@code heartbeat}保持长连接
 *
 * 被调用方有两种
 * * 后台处理：被调用方在后台轮询{@code pullTransaction}接口 (间隔<10秒)
 * * 其他处理：平台将开启一个新窗口，启动被调用方
 */
export class CallApi extends ExposedService {
    /**
     * 请求某一应用接口,长连接等待返回
     * TODO：该接口请求时间可能超过浏览器，需要重试
     * @param app 被调用应用id
     * @param service 需要调用的接口
     * @param payload 传给接口的参数
     * @throws gatewayTimeout 对面应用超时没有回复
     * @return 接口返回结果
     */
    @api()
    async request(app: string, service: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
        const from = await useApp();
        const callApp = await withContext(useApp, [useAppId, AppId.fromString(app)]);
        let {url, background} = await callApp.getService(service);

        const timeout = new WatchDog(30_000);//first time 30s timeout
        const ts: Transaction = {
            id: randomUUID(),
            token: randomUUID(),
            from: from.id.toString(), time: Date.now(),
            app, service, payload, timeout,
        };
        if (background) {
            const doge = this.backGroundAlive.get(callApp.id.toString());
            if (!doge || doge.hasTimeout) {
                background = false;
                this.backGroundAlive.delete(callApp.id.toString());
            }
        }
        if (!background)
            await ElectronHelper.createWindow(`${url}?id=${ts.id}`);
        timeout.food();
        timeout.timeoutTime = 10_000;

        return new Promise<Record<string, unknown>>(async (resolve, reject) => {
            ts._callback = resolve;
            this.transactions.set(ts.id, ts);
            await timeout.timeout;
            if (this.transactions.delete(ts.id))
                reject(Boom.gatewayTimeout());
        });
    }

    /**
     * 响应请求
     * @param id 调用时,平台传入的事务id
     * @param token 调用时,平台传入的事务token
     * @param response 返回结果
     * @throws Boom.notAcceptable 'Transaction not found'
     */
    @api()
    async respond(id: string, token: string, response: Record<string, unknown>) {
        const ts = this.transactions.get(id);
        if (!ts) throw Boom.notAcceptable('Transaction not found', {id, token});
        if (ts.token != token) throw Boom.forbidden('token not correct', {id, token});
        this.transactions.delete(id);
        ts._callback!!(response);
    }

    /**
     * 获取请求详情
     * @param id 指定TransactionId，不填为所有
     * @param token Transaction Token，被请求app可以不填，如果传递给第三方App需传入
     */
    @api()
    async pullTransaction(id?: string, token?: string) {
        const app = (await useApp()).id.toString();
        if (!id) {
            if (!this.backGroundAlive.has(app))
                this.backGroundAlive.set(app, new WatchDog(10_000));
            this.backGroundAlive.get(app)!!.food();
        }
        const out = [] as Transaction[];
        for (const v of this.transactions.values()) {
            if ((v.app === app || v.token === token) && (!id || v.id === id))
                out.push(v);
        }
        return out;
    }

    /**
     * 心跳延时
     * 针对长时间请求,例如oauth登录之类需要用户操作的
     * 需定期调用,保证存活 (10s超时)
     */
    @api()
    async heartbeat(id: string, token: string) {
        const ts = this.transactions.get(id);
        if (!ts) throw Boom.notAcceptable('Transaction not found', {id, token});
        if (ts.token != token) throw Boom.forbidden('token not correct', {id, token});
        ts.timeout.food();
    }

    private transactions = new Map<string, Transaction>();
    private backGroundAlive = new Map<string, WatchDog>();
}

export interface Transaction {
    id: string;
    token: string;
    from: string;
    time: number;

    app: string;
    service: string;
    payload: Record<string, unknown>;

    timeout: WatchDog;
    _callback?: (response: Record<string, unknown>) => void;
}
