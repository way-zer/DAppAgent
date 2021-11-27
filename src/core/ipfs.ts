import { create, IPFS, CID } from 'ipfs-core'
import { Boom, toArray } from '../util'
import last from 'it-last'
import LibP2P from 'libp2p'
import { useInject } from '../util/hooks'


export interface Secret {
    id: string
    name: string
}

type FileContent = AsyncIterable<Uint8Array>

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
                    dht: { enabled: false },
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

    async resolveAddr(addr: string): Promise<string> {
        if (addr.startsWith('/ipns/'))
            try {
                return await last(IpfsService.inst.name.resolve(addr, { recursive: true })) || addr
            } catch (e) {
                throw Boom.notFound('Fail to resolve IPNS', { addr })
            }
        return addr
    }

    async getFile(path0: string): Promise<FileContent> {
        const path = await this.resolveAddr(path0)
        if (path.endsWith('/'))
            throw new Error('Target Not a File')
        try {
            await this.inst.files.stat(path)
        } catch (e) {
            throw Boom.notFound('File not found', { path, rawPath: path0 })
        }
        return this.inst.files.read(path)
    }
}

//special singleton, as Ipfs is slow to start when hot reload.
export const IpfsService = new IpfsServiceClass()