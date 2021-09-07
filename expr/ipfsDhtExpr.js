const {create} = require("ipfs-core")
const assert = require("assert")

;const last = require("it-last");
(async () => {
    /**@type import("ipfs-core").IPFS */
    const inst = await create({
        repo: './DAppAgent',
        config: {
            Bootstrap: [],
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

    const dht = inst.libp2p._dht
    // await dht.set()

    try {
        await inst.key.gen("test2")
    } catch (e) {
    }
    const r = await inst.name.publish("QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn", {key: "test2"})
    const r2 = await last(inst.name.resolve(r.name))
    assert(r.value === r2)
})()