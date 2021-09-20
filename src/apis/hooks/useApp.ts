import {App, AppService} from '../../services/apps'
import Boom from '@hapi/boom'
import {useInject} from '../../util/hooks'
import {DarukContext} from 'daruk'

export function splitHost(ctx: DarukContext) {
    const headerIp = ctx.headers['dapp-addr']
    if (headerIp) {
        const sp = headerIp.toString().split(':')
        return {
            ending: ctx.host,
            type: sp[0],
            name: sp[1],
        }
    }
    const sp = ctx.host.split('.')
    const ending = sp.pop()
    const type = (sp.length >= 2 && sp[sp.length - 1].length < 5) ? sp.pop() : 'ipns'
    return {ending, type, name: sp.join('')}
}

export async function useApp(ctx: DarukContext) {
    const {name, type} = splitHost(ctx)
    const apps = useInject(AppService)
    let out: App | null = null
    try {
        switch (type) {
            case 'ipns':
                out = await apps.getPublic(`/ipns/${name}`)
                break
            case 'ipfs':
                out = await apps.getPublic(`/ipfs/${name}`, false)
                break
            case 'dev':
                out = await apps.get(name)
                break
            case 'sys':
                throw Boom.notImplemented()
        }
    } catch (e) {
    }
    if (out === null)
        throw Boom.notFound(`Can find app with ${type}:${name}`)
    return out
}