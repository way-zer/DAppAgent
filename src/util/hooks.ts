import {darukContainer} from 'daruk'
import {interfaces} from 'inversify'


export function useInject<T>(t: interfaces.ServiceIdentifier<T>): T {
    return darukContainer.get(t)
}