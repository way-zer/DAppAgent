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

/**
 * 系统相关功能
 */
export class SystemApi extends ExposedService {
    /**
     * 获取系统信息
     * 包括 ipfs/orbitDB 相关状态
     * 当前节点的版本，本地地址，已连接Peer
     * TODO：该接口返回时间有时候过长，需要优化
     */
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

    /**
     * 连接一个新的Peer
     * @param addr 目标地址(multiAddress格式)
     */
    @api({permission: 'system.admin'})
    async connectPeer(addr: string) {
        await CoreIPFS.inst.swarm.connect(addr);
    }

    /**
     * 更换系统的用户密钥
     * 该接口会弹窗用户确认，耗时可能较长
     * 接口调用成功会重启平台
     */
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
        ElectronHelper.relaunch();
    }

    /**
     * 导出密钥，包括用户密钥和所有的应用密钥
     * 该接口会弹窗用户确认，耗时可能较长
     * @return 一个zip文件的二进制 前端需要配合axios适当处理
     */
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

    /**
     * 弹窗选择一个本地目录
     * 该接口涉及用户操作，耗时可能较长
     */
    @api({permission: 'system.selectDir'})
    async selectDir() {
        return await ElectronHelper.selectDir();
    }
}
