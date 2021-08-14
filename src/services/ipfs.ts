import {Config, Provide, Scope, ScopeEnum} from '@midwayjs/decorator'
import {create, IPFS} from 'ipfs-core'
import {toArray} from '../util'
import LibP2P from 'libp2p'
import {Libp2pFactoryFn} from 'ipfs-core/src/types'

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

    private async createLibp2p({libp2pOptions, options}: Parameters<Libp2pFactoryFn>[0]) {
        // console.log(libp2pOptions)
        // console.log(options)
        const inst = await require('libp2p').create(libp2pOptions)
        this.libP2PUnsafe = inst
        return inst
    }

    async start() {
        this.instUnsafe = await create({
            repo: './DAppAgent',
            config: {
                Bootstrap: this.bootstrapConfig,
                Addresses: {
                    Delegates: [],
                },
            },
            // 根据源码,应当返回Promise
            // @ts-ignore
            libp2p: this.createLibp2p.bind(this),
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