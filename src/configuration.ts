import {hooks} from '@midwayjs/hooks'
import bodyParser from 'koa-body'
import {join} from 'path'
import {ILifeCycle, IMidwayApplication, IMidwayContainer} from '@midwayjs/core'
import {Configuration, Inject} from '@midwayjs/decorator'
import {IpfsService} from './services/ipfs'
import {IMidwayKoaApplication} from '@midwayjs/koa'
import {boomify, isBoom} from '@hapi/boom'

@Configuration({
    imports: [
        hooks({
            middleware: [bodyParser({
                multipart: true,
            })],
        }),
    ],
    importConfigs: [
        join(__dirname, 'config/'),
    ],
    conflictCheck: false,
})
export class AppConfiguration implements ILifeCycle {
    @Inject()
    ipfsService!: IpfsService

    async onReady(container: IMidwayContainer, app: IMidwayKoaApplication) {
        app.use(async (ctx, next) => {
            try {
                await next()
            } catch (e) {
                if (!isBoom(e)) {
                    console.error(e)
                    e = boomify(e)
                }
                const {statusCode, headers, payload} = e.output
                ctx.status = statusCode
                for (const key in headers)
                    ctx.response.headers[key] = headers[key]
                ctx.body = payload
            }
        })
        // app.use(await app.generateMiddleware('gatewayMiddleware'))
        console.log('Start IPFS')
        await this.ipfsService.start()
        console.log(await this.ipfsService.ipfsStatus())

        //clear in dev
        // const keys = await this.ipfsService.inst.key.list()
        // for(const key of keys){
        //     if(key.name!='self')
        //         await this.ipfsService.inst.key.rm(key.name)
        // }
    }

    async onStop(container: IMidwayContainer, app?: IMidwayApplication) {
        await this.ipfsService.stop()
        console.log('Stopped IPFS')
    }
}