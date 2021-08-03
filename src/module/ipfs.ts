import IPFS from 'ipfs-core'
import {config} from '../config'
import {toArray} from '../util'

export let inst: IPFS.IPFS | null = null
export async function start(){
    inst = await IPFS.create({
        repo: './DAppAgent',
        config: {
            Bootstrap: config.bootstrap,
        },
        libp2p: {
            addresses: {
                listen: ['/ip4/127.0.0.1/tcp/0'],
            },
        },
    })
}
export async function stop(){
    const inst0 = inst
    if(inst0 === null)return
    inst = null
    await inst0.stop()
}

//util
export async function ipfsStatus() {
    return {
        running: inst !== null,
        peers: await inst?.swarm?.peers() || [],
        bandwidth: await toArray(inst?.stats?.bw()),
    }
}