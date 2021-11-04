import { controller, DarukContext, get, post, prefix } from 'daruk';
import { constants } from 'http2';
import { IpfsService } from '../services/ipfs';
import { useQuery } from './hooks/simple';

@controller()
@prefix('/api/ipfs')
export class _Ipfs {
    @get('status')
    async status(ctx: DarukContext) {
        const status = await IpfsService.ipfsStatus()
        ctx.body = JSON.stringify(status, (_, v) => (
            (typeof v === 'bigint') ? v.toString() : v
        ))
    }

    @post('peer')
    async connectPeer(ctx: DarukContext) {
        const addr = useQuery(ctx, 'addr')
        const ipfs = IpfsService.inst
        await ipfs.swarm.connect(addr)
        ctx.status = constants.HTTP_STATUS_OK
    }
}