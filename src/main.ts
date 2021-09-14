import {DarukServer} from 'daruk'
import {loadConfig} from './config'
import {IpfsService} from './services/ipfs'

const daruk = DarukServer({
    middlewareOrder: ['boom'],
})

//vite need define a variable
// noinspection JSUnusedLocalSymbols
const services = import.meta.globEager('./services/*.ts')
// noinspection JSUnusedLocalSymbols
const modules2 = import.meta.globEager('./apis/**/*.ts')

async function bootstrap() {
    await loadConfig()
    await IpfsService.start()
    daruk.on('exit', async () => {
        await IpfsService.stop()
    })

    await daruk.binding()
    if (process.env.NODE_ENV === 'production')
        await daruk.listen(7001)
    console.log('Finish bootstrap')
}

let init = bootstrap()
daruk.app.use(async (_, next) => {
    //ensure init before request
    await init
    await next()
})

// noinspection JSUnusedGlobalSymbols
export const app = daruk.app