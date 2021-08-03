import {CID} from 'ipfs-core'

export type App = any //TODO ipfs类型
export interface AppInfo {
    name: string
}

export interface AppMetadata {
    recordSign?: string
    permissions: string[]
}

export async function create(): Promise<App> {
    //TODO
}

export async function publish(app: App, cid: CID) {
    //TODO
}

export async function edit(app: App, set: Partial<AppInfo & AppMetadata>) {
    //TODO
}

export async function getMetadata(app: App): Promise<AppMetadata> {
    //TODO
    throw ""
}

/**
 * @return 文件流/文件内容 待定
 */
export async function getFile(path: string): Promise<any> {
    //TODO
}

export async function getService(name): Promise<any> {
    throw '暂未实现'
}