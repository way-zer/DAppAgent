import {useInject} from '@midwayjs/hooks'
import {AppService} from '../../services/apps'
import {cidBase32} from '../../util'

export async function list() {
    const apps = await useInject(AppService)
    const out = {}
    const list = await apps.list()
    for (const app of list) {
        out[app.name] = {
            cid: cidBase32(await app.getCid()),
            prod: (await app.getProd()).addr,
        }
    }
    return out
}

export async function create(name: string) {
    const apps = await useInject(AppService)
    const app = await apps.create(name)
    await app.publish()
    return await info(name)
}

export async function info(name: string) {
    const apps = await useInject(AppService)
    const app = await apps.get(name)
    if (!app) return {error: 'NOTFOUND'}
    return Object.assign(await app.getMetadata(), {
        name,
        cid: cidBase32(await app.getCid()),
        prod: (await app.getProd()).addr,
    })
}

export async function publish(name: string) {
    const apps = await useInject(AppService)
    const app = await apps.get(name)
    if (!app) return {error: 'NOTFOUND'}
    await app.publish()
}