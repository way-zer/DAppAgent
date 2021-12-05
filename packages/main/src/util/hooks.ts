import { darukContainer, injectable } from 'daruk'
import { interfaces } from 'inversify'

export function useInject<T>(t: interfaces.ServiceIdentifier<T>): T {
    return darukContainer.get(t)
}

export function singletonService<T extends interfaces.Newable<C>, C>(target: T): T {
    injectable().call(null, target)
    darukContainer.bind(target).toSelf().inSingletonScope()
    return target
}