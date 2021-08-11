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