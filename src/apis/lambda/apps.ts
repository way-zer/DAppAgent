import {useInject} from '@midwayjs/hooks'
import {AppService} from '../../services/apps'

export async function createTest() {
    const apps = await useInject(AppService)
    const app = await apps.create('TEST')
    const pApp = await app.publish()
    return pApp.addr
}

export async function create(name: string) {
    const apps = await useInject(AppService)
    const app = await apps.create(name)
    const pApp = await app.publish()
    return pApp.addr
}

export async function debug() {
    debugger
    return 'NOTHING'
}

export async function list() {
    const apps = await useInject(AppService)
    const out = {}
    const list = await apps.listPrivate()
    for (const app of list) {
        out[app.name] = (await app.toPublic()).addr
    }
    return out
}