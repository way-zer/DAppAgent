// noinspection JSUnusedLocalSymbols,JSUnusedGlobalSymbols

import { DarukServer } from 'daruk'
import { loadConfig } from './config'
import { IpfsService } from './services/ipfs'
import { DBService } from './services/db'

async function bootstrap() {
    const daruk = DarukServer({
        middlewareOrder: ['boom'],
    })
    await loadConfig()
    await daruk.loadFile("services")
    await daruk.loadFile("apis")

    await IpfsService.start()
    await DBService.start()

    await daruk.binding()
    await daruk.listen(7001)
}

export const app = bootstrap()