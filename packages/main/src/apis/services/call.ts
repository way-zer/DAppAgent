import {api, ExposedService} from '/@/apis/services/index';
import Boom from '@hapi/boom';
import {useApp} from '/@/apis/hooks/useApp';
import {randomUUID} from 'crypto';
import {AppId, AppManager} from '/@/core/apps';
import {ElectronHelper} from '/@/core/electron';

/**
 * 跨应用调用接口
 */
export class CallApi extends ExposedService {
  /**
   * 请求某一应用接口,长连接等待返回
   * @param app 被调用应用id
   * @param service 需要调用的接口
   * @param payload 传给接口的参数
   */
  @api()
  async request(app: string, service: string, payload: object) {
    const from = await useApp();
    const callApp = await useApp(AppId.fromString(app));
    let addr = await callApp.getService(service);

    const ts: Transaction = {
      id: (Math.random() * 1e9).toFixed(0),
      token: randomUUID(),
      from: from.id.toString(), time: Date.now(),
      app, service, payload,
    };
    const param = JSON.stringify(ts);
    const promise = new Promise<object>((resolve, reject) => {
      ts.timeout = Date.now() + 10_000;
      const tt = setInterval(() => {
        if ((ts.timeout || 1e99) > Date.now()) return;
        reject(Boom.gatewayTimeout());
        this.transactions.delete(ts.id);
        clearInterval(tt);
      }, 10_000);
      ts._callback = (response) => {
        clearInterval(tt);
        resolve(response);
      };
      this.transactions.set(ts.id, ts);
    });
    console.log(param);
    await ElectronHelper.createWindow(addr + '?param=' + encodeURI(param));
    return promise;
  }

  /**
   * 响应请求
   * @param id 调用时,平台传入的事务id
   * @param token 调用时,平台传入的事务token
   * @param response 返回结果
   */
  @api()
  async respond(id: string, token: string, response: object) {
    const ts = this.transactions.get(id);
    if (!ts) throw Boom.notAcceptable('Transaction not found', {id, token});
    if (ts.token != token) throw Boom.forbidden('token not correct', {id, token});
    this.transactions.delete(id);
    ts._callback!!(response);
  }

  @api()
  async pullTransaction(token?: string) {
    const app = (await useApp()).id;
    const out = [] as Transaction[];
    for (const v of this.transactions.values()) {
      if (v.app == app.toString() && (!token || v.token == token))
        out.push(v);
    }
    return out;
  }

  /**
   * 心跳延时
   * 针对长时间请求,例如oauth登录之类需要用户操作的
   * 需每10s调用一次,保证存活
   */
  @api()
  async heartbeat(id: string, token: string) {
    const ts = this.transactions.get(id);
    if (!ts) throw Boom.notAcceptable('Transaction not found', {id, token});
    if (ts.token != token) throw Boom.forbidden('token not correct', {id, token});
    ts.timeout = Date.now() + 10_000;
  }

  private transactions = new Map<string, Transaction>();
}

export interface Transaction {
  id: string;
  token: string;
  from: string;
  time: number;

  app: string;
  service: string;
  payload: object;

  timeout?: number;
  _callback?: (response: object) => void;
}
