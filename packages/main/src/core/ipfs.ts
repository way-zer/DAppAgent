import {create} from 'ipfs-core';
import type {IPFS} from 'ipfs-core';
import last from 'it-last';
import type LibP2P from 'libp2p';
import type {Connection} from 'libp2p';
import Boom from '@hapi/boom';
import {toArray} from '/@/util';
import config from 'config/main.json';
import PeerId from 'peer-id';
import {CID} from 'multiformats';
import parseDuration from 'parse-duration';
import {fromString as uint8ArrayFromString} from 'uint8arrays/from-string';

type FileContent = AsyncIterable<Uint8Array>

export class CoreIPFS {
    static instUnsafe: IPFS | null = null;
    static libP2PUnsafe: LibP2P | null = null;

    static get inst(): IPFS {
        if (!this.instUnsafe) throw Boom.notAcceptable('IPFS hasn\'t start');
        return this.instUnsafe;
    }

    static get libp2p() {
        if (!this.libP2PUnsafe) throw Boom.notAcceptable('IPFS hasn\'t start');
        return this.libP2PUnsafe;
    }

    static async start() {
        if (this.instUnsafe) return;
        const bootstrapConfig = config.ipfs.bootstrap;
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
                    dht: {enabled: true},
                },
            },
        });
        this.libP2PUnsafe = this.inst.libp2p || null;
        this.libp2p.connectionManager.on('peer:connect', (con: Connection) => {
            console.log('New peer connect: ', con.remoteAddr.toString(), con.remotePeer.toString());
        });
        this.libp2p.connectionManager.on('peer:disconnect', (con) => {
            console.log('Peer disconnect: ', con.remoteAddr.toString(), con.remotePeer.toString());
        });
        console.log('IPFS ID is: ' + (await this.inst.id()).id);
        this.inst.key.import;
        if (import.meta.env.DEV)
            import('ipfs-http-server').then(async ({HttpApi}) => {
                // @ts-ignore
                let api = new HttpApi(this.inst);
                await api.start();
                console.log('IPFS Api server:', api.apiAddr);
            });
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
            running: this.instUnsafe !== null && this.inst.isOnline(),
            version: await this.instUnsafe?.version(),
            id: await this.instUnsafe?.id(),
            // repo stat is too slow
            // repo: await this.instUnsafe?.stats?.repo(),
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

    //copy from ipfs.name.publish
    static async publishIPNS(key: PeerId, cid: CID, duration: string = '2d') {
        const ipfs = `/ipfs/${cid}`;
        try {
            const {name} = await this.inst.ipns.publish(key.privKey, uint8ArrayFromString(ipfs), parseDuration(duration));
            return {ipfs, ipns: `/ipns/${name}`};
        } catch (e) {
            throw Boom.notAcceptable('Fail to publish IPNS ' + e, {ipfs, key: cid.toString(), raw: e});
        }
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
