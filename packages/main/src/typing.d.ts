// noinspection JSUnusedGlobalSymbols,ES6UnusedImports

declare module 'it-to-stream' {
  export function readable<T>(source: AsyncIterable<T>): ReadableStream<T>

  export function writable<T>(sink: (source: AsyncIterable<T>) => Promise<void>): WritableStream<T>

  export default readable;
}

declare module 'ipfs-http-response' {
  import type {CID, IPFS} from 'ipfs-core';

  interface Resolver {
    cid(ipfs: IPFS, path: string): Promise<{ cid: CID }>;

    directory(ipfs: IPFS, path: string, cid: CID): Promise<string | [{ Name: string }]>;
  }

  export async function getResponse(ipfs: IPFS, path: string): Promise<Response>

  export const resolver: Resolver;
}

import IPFS from 'ipfs-core-types';
declare module 'ipfs-core-types' {
  import type LibP2P from 'libp2p';
  import {IPNSAPI} from 'ipfs-core/types/src/components/ipns';

  export interface IPFS {
    libp2p?: LibP2P;
    ipns: IPNSAPI;
  }
}

import DarukRequest from 'daruk';

declare module 'daruk' {
  export interface DarukRequest {
    params: {
      [key: string]: string | undefined
    };
  }
}
