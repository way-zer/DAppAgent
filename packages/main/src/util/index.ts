import {bases} from 'multiformats/basics';
import {CID} from 'multiformats';
import {PeerId} from 'ipfs-core';
import {TextDecoder} from 'util';
import Boom from '@hapi/boom';

export async function toArray<T>(gen: AsyncIterable<T> | undefined): Promise<Array<T>> {
    if (!gen) return [];
    const arr = [] as T[];
    for await (const item of gen) {
        arr.push(item);
    }
    return arr;
}

export async function decodeText(file: AsyncIterable<Uint8Array>): Promise<string> {
    const decoder = new TextDecoder();
    let context = '';
    for await (const chunk of file) {
        context += decoder.decode(chunk);
    }
    return context;
}

export function peerIdBase32(pid: string): string {
    return PeerId.createFromB58String(pid).toString();
}

export function cidBase32(cid: string | CID): string {
    return (CID.asCID(cid) || CID.parse(cid.toString())).toV1().toString(bases.base32.encoder);
}

export function parseCID(cid: string): CID {
    try {
        return CID.parse(cid);
    } catch (e: any) {
        throw Boom.badRequest('invalid cid: ' + e.message, {input: cid});
    }
}
