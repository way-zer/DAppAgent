// noinspection JSUnusedLocalSymbols,JSUnusedGlobalSymbols

import { DarukServer } from 'daruk'
import { loadConfig } from './config'
import { IpfsService } from './core/ipfs'
import { DBService } from './core/db'

async function bootstrap() {
    const daruk = DarukServer({
        middlewareOrder: ['boom'],
    })
    await loadConfig()
    await daruk.loadFile("core")
    await daruk.loadFile("apis")

    await IpfsService.start()
    await DBService.start()

    await daruk.binding()
    await daruk.listen(7001)
}

export const app = bootstrap()