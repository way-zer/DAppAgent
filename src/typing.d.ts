import {AccessController} from './services/acessController/interface'

declare module 'it-to-stream' {
    export function readable<T>(source: AsyncIterable<T>): ReadableStream<T>

    export function writable<T>(sink: (source: AsyncIterable<T>) => Promise<void>): WritableStream<T>

    export default readable
}

declare module 'ipfs-http-response' {
    import {CID, IPFS} from 'ipfs-core'

    interface Resolver {
        cid(ipfs: IPFS, path: string): Promise<{ cid: CID }>
        directory(ipfs: IPFS, path: string, cid: CID): Promise<string | [{ Name: string }]>
    }

    export async function getResponse(ipfs: IPFS, path: string): Promise<Response>

    export const resolver: Resolver
}

import 'ipfs-core'

declare module 'ipfs-core' {
    import LibP2P from 'libp2p'

    interface IPFS {
        libp2p?: LibP2P
    }
}

declare module 'orbit-db' {
    import AccessControllers from 'orbit-db-access-controllers'

    class OrbitDB {
        static AccessControllers = AccessControllers
    }

    export default OrbitDB
}