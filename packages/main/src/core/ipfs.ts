import type {IPFS} from 'ipfs-core';
import {create} from 'ipfs-core';
import last from 'it-last';
import type LibP2P from 'libp2p';
import {useInject} from '../util/hooks';
import Boom from '@hapi/boom';
import {toArray} from '/@/util';


export interface Secret {
  id: string;
  name: string;
}

type FileContent = AsyncIterable<Uint8Array>

export class CoreIPFS {
  static instUnsafe: IPFS | null = null;
  static libP2PUnsafe: LibP2P | null = null;

  static get inst() {
    if (!this.instUnsafe) throw 'IPFS hasn\'t start';
    return this.instUnsafe;
  }

  static get libp2p() {
    if (!this.libP2PUnsafe) throw 'LibP2P hasn\'t start';
    return this.libP2PUnsafe;
  }

  static async start() {
    if (this.instUnsafe) return;
    const bootstrapConfig = useInject<string[]>('config.ipfs.bootstrap');
    this.instUnsafe = await create({
      repo: './DAppAgent',
      config: {
        Bootstrap: bootstrapConfig,
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
          dht: {enabled: false},
        },
      },
    });
    // @ts-ignore
    this.libP2PUnsafe = this.inst.libp2p || null;
    console.log('IPFS ID is: ' + (await this.inst.id()).id);
  }

  static async stop() {
    const inst = this.instUnsafe;
    if (inst === null) return;
    this.instUnsafe = null;
    await inst.stop();
    console.log('Stopped IPFS');
  }

  static async ipfsStatus() {
    return {
      running: this.instUnsafe !== null,
      peers: await this.instUnsafe?.swarm?.peers() || [],
      bandwidth: await toArray(this.instUnsafe?.stats?.bw()),
    };
  }

  static async resolveAddr(addr: string): Promise<string> {
    if (addr.startsWith('/ipns/'))
      try {
        return await last(CoreIPFS.inst.name.resolve(addr, {recursive: true})) || addr;
      } catch (e) {
        throw Boom.notFound('Fail to resolve IPNS', {addr});
      }
    return addr;
  }

  static async getFile(path0: string): Promise<FileContent> {
    const path = await this.resolveAddr(path0);
    if (path.endsWith('/'))
      throw new Error('Target Not a File');
    try {
      await this.inst.files.stat(path);
    } catch (e) {
      throw Boom.notFound('File not found', {path, rawPath: path0});
    }
    return this.inst.files.read(path);
  }
}
