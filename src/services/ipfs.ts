import {Config, Provide, Scope, ScopeEnum} from '@midwayjs/decorator'
import {create, IPFS} from 'ipfs-core'
import {toArray} from '../util'
import LibP2P from 'libp2p'


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
    libP2PUnsafe: LibP2P | null = null

    get inst() {
        if (!this.instUnsafe) throw 'IPFS hasn\'t start'
        return this.instUnsafe
    }

    get libp2p() {
        if (!this.libP2PUnsafe) throw 'LibP2P hasn\'t start'
        return this.libP2PUnsafe
    }

    async start() {
        this.instUnsafe = await create({
            repo: './DAppAgent',
            config: {
                Bootstrap: this.bootstrapConfig,
                Addresses: {
                    Delegates: [],
                },
                Pubsub: {
                    Enabled: true,
                    PubSubRouter: 'gossipsub',
                },
            },
            EXPERIMENTAL: {
                ipnsPubsub: true,
            },
            libp2p: {
                config: {
                    dht: {enabled: true},
                },
            },
        })
        this.libP2PUnsafe = this.inst.libp2p || null
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