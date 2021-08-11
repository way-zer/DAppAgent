import {useInject} from '@midwayjs/hooks'
import {AppService} from '../../services/apps'

export async function createTest() {
    const apps = await useInject(AppService)
    const app = await apps.create('TEST')
    const pApp = await app.publish()
    return pApp.addr
}