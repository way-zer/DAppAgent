import {api, ExposedService} from '/@/apis/services/index';
import {CoreIPFS} from '/@/core/ipfs';
import {DBManager} from '/@/core/db';
import {ElectronHelper} from '/@/core/electron';
import Boom from '@hapi/boom';
import JSZip from 'jszip';
import {UserManager} from '/@/core/users';
import {AppManager} from '/@/core/apps';
import PeerId from 'peer-id';
import {bases} from 'multiformats/basics';

export class SystemApi extends ExposedService {
    @api({permission: 'system.info'})
    async status() {
        const ipfsStatus = await CoreIPFS.ipfsStatus();
        return {
            ipfs: ipfsStatus.running,
            orbitDB: !!DBManager.instUnsafe,
            versions: {
                ...ipfsStatus.version,
            },
            id: {
                ...ipfsStatus.id,
                addresses: (ipfsStatus.id?.addresses || []).map(it => it.toString()),
            },
            // repo: {
            //     ...ipfsStatus.repo,
            //     numObjects: (ipfsStatus.repo?.numObjects || 0).toString(),
            //     repoSize: (ipfsStatus.repo?.repoSize || 0).toString(),
            //     storageMax: (ipfsStatus.repo?.storageMax || -1).toString(),
            // },
            peers: ipfsStatus.peers.map(it => ({
                ...it,
                addr: it.addr.toString(),
            })),
            bandwidth: ipfsStatus.bandwidth.map(it => ({
                ...it,
                totalIn: it.totalIn.toString(),
                totalOut: it.totalOut.toString(),
            })),
        };
    }

    @api({permission: 'system.admin'})
    async connectPeer(addr: string) {
        await CoreIPFS.inst.swarm.connect(addr);
    }

    @api({permission: 'system.admin'})
    async importPeerKey(key0: PeerId.JSONPeerId) {
        let msg = '应用请求导入新的用户密钥\n这是一个危险操作，请再次确认\n导入新密钥会导致当前密钥被覆盖，请注意备份';
        if (!await ElectronHelper.showConfirmDialog(msg))
            throw Boom.notAcceptable('cancel by user');
        const key = await PeerId.createFromJSON(key0);
        if (!key.privKey)
            throw Boom.badRequest('Key must include private', {key: key0});
        await CoreIPFS.inst.config.set('Identity', {
            PeerID: key.toB58String(),
            PrivKey: bases.base64pad.encode(key.privKey.bytes),
        });
        await ElectronHelper.showConfirmDialog('应用即将重启已使用新密钥');

    }

    @api({permission: 'system.admin'})
    async exportKeys() {
        let msg = '应用请求导出当前程序的所有密钥\n这是一个危险操作，请再次确认\n泄漏密钥可能造成严重后果';
        if (!await ElectronHelper.showConfirmDialog(msg))
            throw Boom.notAcceptable('cancel by user');
        const zip = JSZip();
        const byIdZip = zip.folder('by-id')!!;

        function zipKey(name: string, key: PeerId) {
            const v = JSON.stringify(key);
            zip.file(name + '.json', v);
            byIdZip.file(key.toB58String(), v);
        }

        zipKey('id', UserManager.self().id);
        for (const app of await AppManager.list()) {
            if (await app.canModify()) {
                zipKey(app.id.toString(), (await app.privateKey())!!);
            }
        }
        return zip.generateNodeStream();
    }

    @api({permission: 'system.selectDir'})
    async selectDir() {
        return await ElectronHelper.selectDir();
    }
}
