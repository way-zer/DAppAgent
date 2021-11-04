import {controller, DarukContext, del, get, post, prefix, put, validate} from 'daruk'
import {useApp, usePrivateApp} from './hooks/useApp'
import {DataBase} from '../services/db'
import Boom from '@hapi/boom'
import {constants} from 'http2'
import {useParam} from "./hooks/simple";

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

    async useDatabase(ctx: DarukContext) {
        const app = await useApp(ctx)
        return await app.getDataBase(useParam(ctx, 'db'))
    }

    /**
     * @deprecated 临时接口,用于研究db特性
     * docstore:
     *      get (key, caseSensitive = false)
     *      query (filter, {fullOp})
     *
     */
    @post(':db/action')
    async action(ctx: DarukContext) {
        const db = await this.useDatabase(ctx)
        const {op, args} = ctx.request.body
        if (!op)
            throw Boom.badRequest('Need parameter name,op', {body: ctx.request.body})
        if (!Array.isArray(args))
            throw Boom.badRequest('Illegal parameter type', {args})
        if (!db[op]) throw Boom.notAcceptable('op not support', {op})
        try {
            ctx.body = await (db[op].call(db, ...args))
        } catch (e: any) {
            throw Boom.notAcceptable('Execute action fail: ' + e.message, {exception: e})
        }
    }

    @put(':db')
    async put(ctx: DarukContext) {
        const db = await this.useDatabase(ctx)
        try {
            ctx.body = await (db['put'](ctx.request.body))
        } catch (e: any) {
            throw Boom.notAcceptable('Execute action fail: ' + e.message, {exception: e})
        }
    }

    @get(':db/:id')
    async get(ctx: DarukContext) {
        const db = await this.useDatabase(ctx)
        const id = ctx.request['params'].id
        try {
            ctx.body = await (db['get'](id))
        } catch (e: any) {
            throw Boom.notAcceptable('Execute action fail: ' + e.message, {exception: e})
        }
    }

    @del(':db/:id')
    async del(ctx: DarukContext) {
        const db = await this.useDatabase(ctx)
        const id = ctx.request['params'].id
        try {
            ctx.body = await (db['del'](id))
        } catch (e: any) {
            throw Boom.notAcceptable('Execute action fail: ' + e.message, {exception: e})
        }
    }

    @get(':db')
    async all(ctx: DarukContext) {
        const db = await this.useDatabase(ctx)
        const begin = +(ctx.query.begin || 0)
        const size = +(ctx.query.size || -1)
        try {
            ctx.body = db['query'](() => true).slice(begin, size === -1 ? undefined : size)
        } catch (e: any) {
            throw Boom.notAcceptable('Execute action fail: ' + e.message, {exception: e})
        }
    }
}