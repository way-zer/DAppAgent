import {DarukContext} from 'daruk'
import {badRequest} from '@hapi/boom'

export function useQuery(ctx: DarukContext, key: string): string {
    const value = ctx.query[key]
    if (!value || typeof value !== 'string')
        throw badRequest(`need query '${key}'`)
    return value
}