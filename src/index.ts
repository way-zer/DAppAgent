import IPFS from 'ipfs-core'

async function main() {
    const ipfs = await IPFS.create({
        repo: './DAppAgent',
        libp2p: {
            addresses: {
                listen: ['/ip4/127.0.0.1/tcp/0'],
            },
        },
    })
    const {cid} = await ipfs.add('Hello world')
    console.log(cid)
    for await (const chunk of ipfs.get(cid)){
        console.log(chunk)
    }
    await ipfs.stop()
    console.log("finished")
}

console.log('Hello World')
main().then()
