import {useInject, useLogger} from '@midwayjs/hooks'
import {IpfsService} from '../../services/ipfs'

export async function status() {
    const ipfs = await useInject(IpfsService)
    return JSON.stringify(await ipfs.ipfsStatus(), (_, v) => (
        (typeof v === 'bigint') ? v.toString() : v
    ))
}