// noinspection JSUnusedLocalSymbols,JSUnusedGlobalSymbols

import {darukContainer, DarukServer} from 'daruk'
import {loadConfig} from './config'
import {IpfsService} from './services/ipfs'
import {checkChange} from './util/hmrHelper'

async function loadModule() {
    //vite need define a variable
    const services = import.meta.glob('./services/*.ts')
    const modules2 = import.meta.glob('./apis/**/*.ts')

    for (const it of Object.values(services)) await it()
    for (const it of Object.values(modules2)) await it()
}

async function bootstrap() {
    const daruk = DarukServer({
        middlewareOrder: ['boom'],
    })
    await checkChange("snapshot",null,()=>{
        darukContainer.restore()
    })
    darukContainer.snapshot()
    await loadConfig()
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