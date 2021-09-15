// noinspection JSUnusedLocalSymbols,JSUnusedGlobalSymbols

import {DarukServer} from 'daruk'
import {loadConfig} from './config'
import {IpfsService} from './services/ipfs'

async function loadModule() {
    //vite need define a variable
    const services = import.meta.globEager('./services/*.ts')
    const modules2 = import.meta.globEager('./apis/**/*.ts')
}

async function bootstrap() {
    await loadConfig()
    const daruk = DarukServer({
        middlewareOrder: ['boom'],
    })
    await loadModule()

    await IpfsService.start()
    daruk.on('exit', async () => {
        await IpfsService.stop()
    })

    await daruk.binding()
    if (process.env.NODE_ENV === 'production')
        await daruk.listen(7001)

    return daruk.app
}

export const app = bootstrap()