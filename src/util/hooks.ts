import {darukContainer, DarukContext, injectable} from 'daruk'
import {interfaces} from 'inversify'


export function useInject<T>(t: interfaces.ServiceIdentifier<T>): T {
    return darukContainer.get(t)
}

export function useContext(): DarukContext {
    return useInject('ctx')
}

export function singletonService<T>(target: interfaces.Newable<T>): interfaces.Newable<T> {
    injectable().call(null, target)
    darukContainer.bind(target).toSelf().inSingletonScope()
    return target
}