import {IpfsService} from '../services/ipfs'
import last from 'it-last'
import {resolver} from 'ipfs-http-response'
import toStream from 'it-to-stream'
import detectContentType from 'ipfs-http-response/src/utils/content-type'
import assert from 'assert'
import {CID} from 'ipfs-core'
import {DarukContext} from 'daruk'

export const IpfsResponse = {
    async findIndexFile(path0: string): Promise<CID | null> {
        assert(path0.endsWith('/'))
        const INDEX_FILES = ['index.html']
        for (const file in INDEX_FILES) {
            try {
                const stats = await IpfsService.inst.files.stat(path0 + file)
                return stats.cid
            } catch (e) {
            }
        }
        return null
    },
    async handle(ctx: DarukContext, path0: string) {
        const ipfs = IpfsService.inst
        const rawPath = ctx.path

        let ipfsPath = path0
        if (!path0.startsWith('/ipfs/')) {
            ipfsPath = await last(ipfs.name.resolve(path0, {recursive: true})) || path0
        }
        ipfsPath = decodeURI(ipfsPath)

        let data
        try {
            data = await resolver.cid(ipfs, ipfsPath)
            if (rawPath.endsWith('/')) {
                return ctx.redirect(rawPath.substr(0, rawPath.length - 1))
            }
        } catch (err) {
            const errorToString = err.toString()
            console.error('err: ', errorToString, ' fileName: ', err.fileName)

            // switch case with true feels so wrong.
            switch (true) {
                case (errorToString === 'Error: This dag node is a directory'):
                    data = await resolver.directory(ipfs, ipfsPath, err.cid)
                    if (!rawPath.endsWith('/')) {
                        // add trailing slash for directory listings
                        return ctx.redirect(`${rawPath}/`)
                    }
                    if (typeof data === 'string') {
                        // send directory listing
                        return
                        ctx.body = data
                        return
                    }

                    // found index file: return <ipfsPath>/<found-index-file>
                    ipfsPath += '/' + data[0].Name
                    data = await resolver.cid(ipfs, ipfsPath)
                    break
                case (errorToString.startsWith('Error: no link named')):
                    ctx.throw(err, 404)
                    return
                case (errorToString.startsWith('Error: multihash length inconsistent')):
                case (errorToString.startsWith('Error: Non-base58 character')):
                case (errorToString.startsWith('Error: invalid character')):
                    ctx.throw(err, 404)
                    return
                default:
                    console.error(err)
                    throw err
            }
        }

        // Support If-None-Match & Etag (Conditional Requests from RFC7232)
        // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag
        const etag = `"${data.cid}"`
        ctx.response.headers['etag'] = etag
        const cachedEtag = ctx.headers['if-none-match']
        if (cachedEtag === etag || cachedEtag === `W/${etag}`) {
            return ctx.response.status = 304 // Not Modified
        }
        // Immutable content produces 304 Not Modified for all values of If-Modified-Since
        if (path0.startsWith('/ipfs/') && ctx.headers['if-modified-since']) {
            return ctx.response.status = 304 // Not Modified
        }
        if (path0.startsWith('/ipfs/')) {
            ctx.response.headers['Cache-Control'] = 'public, max-age=29030400, immutable'
        }

        // This necessary to set correct Content-Length and validate Range requests
        // Note: we need `size` (raw data), not `cumulativeSize` (data + DAGNodes)
        const {size} = await ipfs.files.stat(`/ipfs/${data.cid}`)
        ctx.response.headers['Content-Length'] = `${size}`
        //NOTE: SKIP handle for range
        const {source, contentType} = await detectContentType(ipfsPath, ipfs.cat(data.cid))
        if (contentType) ctx.type = contentType
        ctx.body = toStream((async function* () {
            for await (const chunk of source) {
                yield chunk.slice() // Convert BufferList to Buffer
            }
        })())
    },
}