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

export function peerIdB58ToBase32(pid: string): string {
    try {
        const id = PeerId.createFromB58String(pid);
        return bases.base32.encode(id.toBytes());
    } catch {
        return 'BAD_DATA';
    }
}