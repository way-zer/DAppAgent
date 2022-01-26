## IPFS MFS储存结构

- /apps
  - {id}
    - meta - dag 应用元信息 AppMeta
    - local - dag 应用本地配置文件 LocalData
    - key - file 私钥(可用于签名,备案,IPNS)

## 应用元信息Dag AppMeta

站长设定的应用信息+初始化生成的数据+发布时的数据

```ts
type AppMeta = {
  name: string,//默认使用代码中配置
  desc: string,//默认使用代码中配置
  icon?: string | CID,//相对路径,或ipfs绝对路径，默认使用代码中配置
  ext: object,//可在fork时作为附加参数,或API修改

  creator: PeerId,//自动填充
  fork?: CID,//fork时自动填充
  updated: Date,//自动生成
  databases: Record<string/*name*/, string/*addr*/>//自动生成
  recordSign?: 备案签名,//备案添加
  program: CID,//应用代码根
}
```

## 应用本地配置文件Dag LocalData

应用在本地的配置信息,由平台内部管理

```ts
type LocalData = {
  firstUse: Date,
  lastUse: Date,
  permissions: Record<string, {
    granted: boolean,
    time: Date
  }>
}
```

## 应用代码 目录结构

- /
  - app.json
  - html/css/js 等代码文件

### app.json 定义

```ts
import {AccessType, DBType} from './db';

type ProgramMeta = {
  name: string,
  desc: string,
  author: string,
  icon?: string | CID,//相对路径,或ipfs绝对路径
  ext: object,//开发者自行配置
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
```
