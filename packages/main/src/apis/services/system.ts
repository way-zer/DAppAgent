import {api, ExposedService} from '/@/apis/services/index';
import {CoreIPFS} from '/@/core/ipfs';
import {DBManager} from '/@/core/db';
import {ElectronHelper} from '/@/core/electron';

export class SystemApi extends ExposedService {
  @api({permission: 'system.info'})
  async status() {
    const ipfsStatus = await CoreIPFS.ipfsStatus();
    return {
      ipfs: ipfsStatus.running,
      orbitDB: !!DBManager.instUnsafe,
      bandwidth: ipfsStatus.bandwidth.map(it => ({
        ...it,
        totalIn: it.totalIn.toString(),
        totalOut: it.totalOut.toString(),
      })),
      peers: ipfsStatus.peers.map(it => ({
        ...it,
        addr: it.addr.toString(),
      })),
    };
  }

  @api({permission: 'system.admin'})
  async connectPeer(addr: string) {
    await CoreIPFS.inst.swarm.connect(addr);
  }

  @api({permission: 'system.selectDir'})
  async selectDir() {
    return await ElectronHelper.selectDir();
  }
}
