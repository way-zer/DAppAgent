import {hooks} from '@midwayjs/hooks'
import bodyParser from 'koa-bodyparser'
import {join} from 'path'
import {ILifeCycle, IMidwayApplication, IMidwayContainer} from '@midwayjs/core'
import {Configuration, Inject, Provide} from '@midwayjs/decorator'
import {IpfsService} from './services/ipfs'

@Configuration({
    imports: [
        hooks({
            middleware: [bodyParser()],
        }),
    ],
    importConfigs: [
        join(__dirname, 'config/'),
    ],
})
export class App implements ILifeCycle {
    @Inject()
    ipfsService!: IpfsService

    async onReady(container: IMidwayContainer, app?: IMidwayApplication) {
        console.log('Start IPFS')
        await this.ipfsService.start()
        console.log(await this.ipfsService.ipfsStatus())
    }

    async onStop(container: IMidwayContainer, app?: IMidwayApplication) {
        await this.ipfsService.stop()
        console.log('Stopped IPFS')
    }
}