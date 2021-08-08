import {Config, Provide, Scope, ScopeEnum} from '@midwayjs/decorator'
import {create, IPFS} from 'ipfs-core'
import {toArray} from '../util'

export interface Secret {
    id: string
    name: string
}

@Provide()
@Scope(ScopeEnum.Singleton)
export class IpfsService {
    @Config('ipfs.bootstrap')
    bootstrapConfig
    instUnsafe: IPFS | null = null

    get inst() {
        if (!this.instUnsafe) throw 'IPFS hasn\'t start'
        return this.instUnsafe
    }

    async start() {
        this.instUnsafe = await create({
            repo: './DAppAgent',
            config: {
                Bootstrap: this.bootstrapConfig,
                Addresses: {
                    Gateway: '/ipv4/0.0.0.0/7002',
                },
            },
            libp2p: {
                addresses: {
                    listen: ['/ip4/127.0.0.1/tcp/0'],
                },
            },
        })
    }

    async stop() {
        const inst = this.instUnsafe
        if (inst === null) return
        this.instUnsafe = null
        await inst.stop()
    }

    async ipfsStatus() {
        return {
            running: this.instUnsafe !== null,
            peers: await this.instUnsafe?.swarm?.peers() || [],
            bandwidth: await toArray(this.instUnsafe?.stats?.bw()),
        }
    }
}