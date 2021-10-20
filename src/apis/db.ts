import {controller, DarukContext, get, post, prefix, validate} from 'daruk'
import {useApp, usePrivateApp} from './hooks/useApp'
import {DataBase} from '../services/db'
import Boom from '@hapi/boom'
import {constants} from 'http2'
import {useQuery} from './hooks/simple'

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
        if (!db[op]) throw Boom.notAcceptable('op not support', {op})
        try {
            ctx.body = await (db[op].call(db, ...args))
        } catch (e: any) {
            throw Boom.notAcceptable('Execute action fail: ' + e.message, {exception: e})
        }
    }

    @post('put')
    async put(ctx: DarukContext) {
        const app = await useApp(ctx)
        const {name, doc} = ctx.request.body
        if (!name || typeof doc !== 'object')
            throw Boom.badRequest('Need parameter name,doc', {body: ctx.request.body})
        const db = await app.getDataBase(name)
        try {
            ctx.body = await (db['put'](doc))
        } catch (e: any) {
            throw Boom.notAcceptable('Execute action fail: ' + e.message, {exception: e})
        }
    }

    @post('del')
    async del(ctx: DarukContext) {
        const app = await useApp(ctx)
        const {name, id} = ctx.request.body
        if (!name || !id)
            throw Boom.badRequest('Need parameter name,id', {body: ctx.request.body})
        const db = await app.getDataBase(name)
        try {
            ctx.body = await (db['del'](id))
        } catch (e: any) {
            throw Boom.notAcceptable('Execute action fail: ' + e.message, {exception: e})
        }
    }

    @get('query')
    async all(ctx: DarukContext) {
        const app = await useApp(ctx)
        const name = useQuery(ctx, 'db')
        const begin = +(ctx.query.begin || 0)
        const size = +(ctx.query.size || -1)
        if (!name)
            throw Boom.badRequest('Need parameter name', {body: ctx.request.body})
        const db = await app.getDataBase(name)
        try {
            ctx.body = db['query'](() => true).slice(begin, size === -1 ? undefined : size)
        } catch (e: any) {
            throw Boom.notAcceptable('Execute action fail: ' + e.message, {exception: e})
        }
    }
}