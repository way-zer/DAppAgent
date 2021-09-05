import {hooks} from '@midwayjs/hooks'
import bodyParser from 'koa-bodyparser'
import {join} from 'path'
import {ILifeCycle, IMidwayApplication, IMidwayContainer} from '@midwayjs/core'
import {Configuration, Inject} from '@midwayjs/decorator'
import {IpfsService} from './services/ipfs'
import {IMidwayKoaApplication} from '@midwayjs/koa'

@Configuration({
    imports: [
        hooks({
            middleware: [bodyParser()],
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
        app.use(await app.generateMiddleware('gatewayMiddleware'))
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