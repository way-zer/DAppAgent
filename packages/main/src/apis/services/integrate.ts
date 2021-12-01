import type {User} from '../../core/users';
import type {App} from '../../core/apps';

const MOCK_Verify_Sign = 'Verify_Sign';
const MOCK_Record_Sign = 'Verify_Sign';

export class IntegrateService {
  /**
   * 通过第三方进行实名认证
   * @return string 认证签名
   */
  async userVerify(user: User): Promise<string> {
    /*TODO
    通过self密钥,生成持有签名
    将公钥(地址)及持有签名一起传递到第三方,获取认证签名
     */
    return MOCK_Verify_Sign;
    }

    /** 验证实名签名是否有效 */
    async userVerifyOK(user: User, sign: string): Promise<boolean> {
        //TODO 通过第三方公钥验证签名是否正确
      return sign == MOCK_Verify_Sign;
    }

    async appRecord(app: App): Promise<string> {
        /*TODO
        通过app密钥,生成持有签名
        将公钥(IPNS地址)及持有签名一起传递到第三方,获取备案签名
         */
      return MOCK_Record_Sign;
    }

    async appRecordOK(app: App, sign: string): Promise<boolean> {
        //TODO 通过第三方公钥验证签名是否正确
      return sign == MOCK_Record_Sign;
    }
}
