import { darukContainer } from 'daruk'
import { buildInjectionModule } from 'inversify-config-binding'
import defualt from './config.default'

export async function loadConfig() {
    let config = defualt
    if (process.env.TS_NODE_DEV) {
        try {
            const overlay = (await import('./config.local')).default
            config = Object.assign(config, overlay)
        } catch (e) {
        }
    }
    darukContainer.load(buildInjectionModule(config, { prefix: 'config' }))
}