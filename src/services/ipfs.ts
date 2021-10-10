import {create, IPFS} from 'ipfs-core'
import {toArray} from '../util'
import LibP2P from 'libp2p'
import {useInject} from '../util/hooks'
import {checkChange} from '../util/hmrHelper'


export interface Secret {
    id: string
    name: string
}

class IpfsServiceClass {
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
        if (this.instUnsafe) return
        await checkChange('ipfs', this, (old) => old.stop())

        const bootstrapConfig = useInject<string[]>('config.ipfs.bootstrap')
        this.instUnsafe = await create({
            repo: './DAppAgent',
            config: {
                Bootstrap: bootstrapConfig,
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
                    dht: {enabled: false},
                },
            },
        })
        // @ts-ignore
        this.libP2PUnsafe = this.inst.libp2p || null
        console.log('IPFS ID is: ' + (await this.inst.id()).id)
    }

    async stop() {
        const inst = this.instUnsafe
        if (inst === null) return
        this.instUnsafe = null
        await inst.stop()
        console.log('Stopped IPFS')
    }

    async ipfsStatus() {
        return {
            running: this.instUnsafe !== null,
            peers: await this.instUnsafe?.swarm?.peers() || [],
            bandwidth: await toArray(this.instUnsafe?.stats?.bw()),
        }
    }
}

//special singleton, as Ipfs is slow to start when hot reload.
export const IpfsService = new IpfsServiceClass()