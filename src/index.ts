import * as ipfs from './module/ipfs'

async function main() {
    console.log('Start IPFS')
    await ipfs.start()
    console.log(await ipfs.ipfsStatus())
    await ipfs.stop()
    console.log('Stopped IPFS')
}

main().then()
