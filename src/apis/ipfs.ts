import {IpfsService} from '../services/ipfs'
import {controller, DarukContext, get, prefix} from 'daruk'

@controller()
@prefix('/api/ipfs')
export class _Ipfs {
    @get('/status')
    async status(ctx: DarukContext) {
        ctx.body = JSON.stringify(await IpfsService.ipfsStatus(), (_, v) => (
            (typeof v === 'bigint') ? v.toString() : v
        ))
    }
}