import {CID} from 'multiformats';
import {AccessType, AccessTypeStruct, DBType, DBTypeStruct} from '/@/core/db';
import PeerId from 'peer-id';
import {array, boolean, defaulted, object, optional, record, string, unknown} from 'superstruct';

type Timestamp = number //Date.now
type StringFor<T> = string

export const AppPermissionStruct = object({
    node: string(),
    desc: string(),
    //非可选将在用户安装应用时请求权限
    optional: defaulted(boolean(), false),
});

export type AppPermission = typeof AppPermissionStruct['TYPE']

export const ProgramMetaStruct = object({
    name: string(),
    desc: string(),
    author: string(),
    icon: defaulted(string(), ''),
    ext: record(string(), unknown()),//开发者自行配置
    permissions: array(AppPermissionStruct),
    databases: array(object({
        name: string(),//在同一个应用内必须唯一
        type: DBTypeStruct,
        access: AccessTypeStruct,
    })),
    singlePageApp: defaulted(boolean(), false),//默认false。true将支持SPA应用路由。
    services: record(string()/*name*/, object({
        url: string(),
        background: defaulted(boolean(), false),//默认false。false表示不显示窗口,在后台处理,可通过API显示
    })),
});

export type ProgramMeta = typeof ProgramMetaStruct['TYPE']

export type AppMeta = {
    name?: string,//默认使用代码中配置
    desc?: string,//默认使用代码中配置
    icon?: string,//默认使用代码中配置
    ext: Record<string, any>,//可在fork时作为附加参数,或API修改

    id: string,//应用的公钥Id,B58String
    creator: StringFor<PeerId>,//所有者的公钥Id,B58String,自动填充
    fork?: CID,//来源cid,fork时自动填充
    updated: Timestamp,//自动生成
    databases: Record<string/*name*/, string/*addr*/>//自动生成
    recordSign?: string,//备案添加
    program: CID,//应用代码根
}

export type AppLocalMeta = {
    firstUse: Timestamp,
    lastUse: Timestamp,
    lastCheckUpdate: Timestamp,
    permissions: Record<string, {
        granted: boolean,
        time: Timestamp
    }>,
    lastLocalProgramDir?: string
}
