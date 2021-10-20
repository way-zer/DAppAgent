import {controller, DarukContext, post, prefix, validate} from 'daruk'
import {useApp, usePrivateApp} from './hooks/useApp'
import {DataBase} from '../services/db'
import Boom from '@hapi/boom'
import {constants} from 'http2'

@controller()
@prefix('/api/db')
export class _DB {
    @post('create')
    @validate({
        name: {required: true, type: 'string'},
        type: {required: true, type: 'string'},
        access: {required: true, type: 'string'},
    })
    async create(ctx: DarukContext) {
        const app = await usePrivateApp(ctx)
        const info = ctx.request.body as DataBase
        if (info.addr)
            throw Boom.badRequest('Illegal parameter addr', {data: info})
        await app.newDataBase(info.name, info.type, info.access)
        ctx.status = constants.HTTP_STATUS_OK
    }

    /**
     * @deprecated 临时接口,用于研究db特性
     * docstore:
     *      get (key, caseSensitive = false)
     *      query (filter, {fullOp})
     *
     */
    @post('action')
    async action(ctx: DarukContext) {
        const app = await useApp(ctx)
        const {name, op, args} = ctx.request.body
        if (!name || !op)
            throw Boom.badRequest('Need parameter name,op', {body: ctx.request.body})
        if (!Array.isArray(args))
            throw Boom.badRequest('Illegal parameter type', {args})
        const db = await app.getDataBase(name)
        if (op ! in db) throw Boom.notAcceptable('op not support', {op})
        try {
            ctx.body = await (db[op].call(db, ...args))
        } catch (e: any) {
            throw Boom.notAcceptable('Execute action fail: ' + e.message, {exception: e})
        }
    }
}