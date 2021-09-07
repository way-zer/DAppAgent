const last = require("it-last");
const assert = require("assert");
const {create} = require("ipfs-core")

;(async () => {
    const ipfs = await create({
        repo: './DAppAgent',
        config: {
            Bootstrap: [],
            Addresses: {
                Delegates: [],
            },
        },
        libp2p: {
            config: {
                dht: {enabled: true},
            },
        },
    })
    try {
        await ipfs.key.gen("test")
    } catch (e) {//exist
    }
    const r = await ipfs.name.publish("QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn", {key: "test"})
    const r2 = await last(ipfs.name.resolve(r.name))
    console.log(r, r2)
    assert(r.value === r2)
})()