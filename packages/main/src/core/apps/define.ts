import {CID} from 'multiformats';
import {AccessType, DBType} from '/@/core/db';
import PeerId from 'peer-id';

type Timestamp = number //Date.now
type StringFor<T> = string

export type ProgramMeta = {
  name: string,
  desc: string,
  author: string,
  icon: string,
  ext: Record<string, any>,//开发者自行配置
  permissions: {
    node: string,
    desc: string,
    optional: boolean//默认true, 在用户安装应用时请求权限
  }[],
  databases: {
    name: string,//在同一个应用内必须唯一
    type: DBType,
    access: AccessType,
  }[],
  services: Record<string/*name*/, {
    url: string,
    background: boolean//默认false。false表示不显示窗口,在后台处理,可通过API显示
  }>
}

export type AppMeta = {
  name: string,//默认使用代码中配置
  desc: string,//默认使用代码中配置
  icon: string,//默认使用代码中配置
  ext: Record<string, any>,//可在fork时作为附加参数,或API修改

  creator: StringFor<PeerId>,//自动填充
  fork?: CID,//来源cid,fork时自动填充
  updated: Timestamp,//自动生成
  databases: Record<string/*name*/, string/*addr*/>//自动生成
  recordSign?: string,//备案添加
  program: CID,//应用代码根
}

export type AppLocalMeta = {
  firstUse: Timestamp,
  lastUse: Timestamp,
  permissions: Record<string, {
    granted: boolean,
    time: Timestamp
  }>,
  lastLocalProgramDir?: string
}
