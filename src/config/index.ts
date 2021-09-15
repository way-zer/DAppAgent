import {darukContainer} from 'daruk'
import {buildInjectionModule} from 'inversify-config-binding'

export async function loadConfig() {
    let config = (await import('./config.default')).default
    try {
        const overlay = (await import('./config.local')).default
        config = Object.assign(config, overlay)
    } catch (e) {
    }
    darukContainer.load(buildInjectionModule(config, {prefix: 'config'}))
}