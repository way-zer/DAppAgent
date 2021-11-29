// noinspection JSUnusedLocalSymbols,JSUnusedGlobalSymbols

import { DarukServer } from 'daruk'
import { loadConfig } from './config'
import { CoreIPFS } from './core/ipfs'
import { DBManager } from './core/db'

async function bootstrap() {
    const daruk = DarukServer({
        middlewareOrder: ['boom'],
    })
    await loadConfig()
    await daruk.loadFile("core")
    await daruk.loadFile("apis")

    await CoreIPFS.start()
    await DBManager.start()

    await daruk.binding()
    await daruk.listen(7001)
}

export const app = bootstrap()