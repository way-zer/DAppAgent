import {api, ExposedService} from './index';
import {useApp} from '../hooks/useApp';
import {parseCID, toArray} from '/@/util';
import {CoreIPFS} from '/@/core/ipfs';
import {AppsApi} from '/@/apis/services/apps';
import {MFSEntry} from 'ipfs-core/types/src/components/files/ls';

export class FileApi extends ExposedService {
  @api()
  async list(path: string = '/'): Promise<(MFSEntry & { cid: string })[]> {
    const app = await useApp();
    path = app.addr + '/public' + path;
    const files = await toArray(CoreIPFS.inst.files.ls(path));
    return files.map(file => ({
      ...file,
      cid: file.cid.toString(),
    })) as any;
  }

  /**
   * 上传文件,或复制文件
   * 上传需先通过/ipfs/upload接口换取cid
   */
  @api({permission: 'file.admin'})
  async upload(appName: string, path: string, cid: string) {
    const app = await AppsApi.useLocalApp(appName);
    const cid0 = parseCID(cid);
    path = app.addr + '/public' + path;
    await CoreIPFS.inst.files.cp(cid0, path);
  }

  @api({permission: 'file.admin'})
  async mkdir(appName: string, path: string) {
    const app = await AppsApi.useLocalApp(appName);
    path = app.addr + '/public' + path;
    await CoreIPFS.inst.files.mkdir(path);
  }

  @api({permission: 'file.admin'})
  async delete(appName: string, path: string) {
    const app = await AppsApi.useLocalApp(appName);
    path = app.addr + '/public' + path;
    await CoreIPFS.inst.files.rm(path);
  }
}
