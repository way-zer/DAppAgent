import * as integrate from './integrate'


export type User = any //TODO ipfs中的类型代替
export interface UserMetadata {
    verifySign?: string
}

async function self(): Promise<User> {
    throw ''//TODO
}

export async function verify() {
    const user = await self()
    if ((await getMetadata(user)).verifySign) return
    const sign = await integrate.userVerify(user)
    //TODO 设置签名
}

/**
 * @param user0 用户,留空为自己
 */
export async function getMetadata(user0?: User): Promise<UserMetadata> {
    const user = user0 || await self()
    throw ''/*TODO
    通过metadata反JSON
     */
}