import {ExposedService, useService} from '/@/apis/services/_define';
import {App} from '/@/core/apps';
import {CoreIPFS} from '/@/core/ipfs';
import {PeerId} from 'ipfs-core';
import Boom from '@hapi/boom';

export class IntegrateApi extends ExposedService {
  // /**
  //  * 通过第三方进行实名认证
  //  * @return string 认证签名
  //  */
  // async userVerify(user: User): Promise<string> {
  //   /*TODO
  //   通过self密钥,生成持有签名
  //   将公钥(地址)及持有签名一起传递到第三方,获取认证签名
  //    */
  //   return MOCK_Verify_Sign;
  //   }
  //
  //   /** 验证实名签名是否有效 */
  //   async userVerifyOK(user: User, sign: string): Promise<boolean> {
  //       //TODO 通过第三方公钥验证签名是否正确
  //     return sign == MOCK_Verify_Sign;
  //   }
  async appRecord(app: App): Promise<string> {
    const meta = await app.appMeta.get();
    delete meta.recordSign;
    const metaCid = (await CoreIPFS.inst.dag.put(meta));
    const appKey = (await app.privateKey())!!;
    const userId = CoreIPFS.libp2p.peerId;
    const result = await useService('call').request('sys:beian', 'appRecord', {
      cid: metaCid.toString(),
      id: (await PeerId.createFromPrivKey(appKey.bytes)).toString(),
      appSign: await appKey.sign(metaCid.bytes),
      user: userId.toString(),
      userSign: await userId.privKey.sign(metaCid.bytes),
    }) as any;
    if (!result.sign)
      throw Boom.notAcceptable('Fail to get app Sign', {app: app.id.toString()});
    return result.sign;
  }

  async appRecordOK(app: App, sign: string): Promise<boolean> {
    //TODO 通过第三方公钥验证签名是否正确
    console.log('TODO: appRecordOK', app, sign);
    return true;
  }

  constructor() {
    super();
    App.verifier = async (app: App) => {
      if (app.id.type === 'dev') return true;
      const sign = (await app.appMeta.get()).recordSign;
      if (!sign) return false;
      return this.appRecordOK(app, sign);
    };
  }
}
