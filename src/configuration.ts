import {hooks} from '@midwayjs/hooks'
import bodyParser from 'koa-bodyparser'
import {join} from 'path'
import {ILifeCycle, IMidwayApplication, IMidwayContainer} from '@midwayjs/core'
import {App, Configuration, Inject} from '@midwayjs/decorator'
import {IpfsService} from './services/ipfs'
import {Application} from '@midwayjs/koa'

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
    @App()
    app!: Application
    @Inject()
    ipfsService!: IpfsService

    async onReady(container: IMidwayContainer, app?: IMidwayApplication) {
        this.app.use(await this.app.generateMiddleware('gatewayMiddleware'))
        console.log('Start IPFS')
        await this.ipfsService.start()
        console.log(await this.ipfsService.ipfsStatus())
    }

    async onStop(container: IMidwayContainer, app?: IMidwayApplication) {
        await this.ipfsService.stop()
        console.log('Stopped IPFS')
    }
}