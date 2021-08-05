import {Config, Provide, Scope, ScopeEnum} from '@midwayjs/decorator'
import {create, IPFS} from 'ipfs-core'
import {toArray} from '../util'

export {Key as Secret} from 'ipfs-core-types/src/key'

@Provide()
@Scope(ScopeEnum.Singleton)
export class IpfsService {
    @Config('ipfs.bootstrap')
    bootstrapConfig
    inst: IPFS | null = null

    get safeInst() {
        if (!this.inst) throw 'IPFS hasn\'t start'
        return this.inst
    }

    async start() {
        this.inst = await create({
            repo: './DAppAgent',
            config: {
                Bootstrap: this.bootstrapConfig,
            },
            libp2p: {
                addresses: {
                    listen: ['/ip4/127.0.0.1/tcp/0'],
                },
            },
        })
    }

    async stop() {
        const inst = this.inst
        if (inst === null) return
        this.inst = null
        await inst.stop()
    }

    async ipfsStatus() {
        return {
            running: this.inst !== null,
            peers: await this.inst?.swarm?.peers() || [],
            bandwidth: await toArray(this.inst?.stats?.bw()),
        }
    }
}