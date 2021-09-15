import {darukContainer} from 'daruk'
import {buildInjectionModule} from 'inversify-config-binding'
import {checkChange} from '../util/hmrHelper'

export async function loadConfig() {
    let config = (await import('./config.default')).default
    try {
        const overlay = (await import('./config.local')).default
        config = Object.assign(config, overlay)
    } catch (e) {
    }
    const module = buildInjectionModule(config, {prefix: 'config'})
    await checkChange('config', module, (old) => darukContainer.unload(old))
    darukContainer.load(module)
}