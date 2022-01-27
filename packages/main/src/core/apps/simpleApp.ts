import {AppMeta, ProgramMeta} from '/@/core/apps/define';
import {CID} from 'multiformats';
import {CoreIPFS} from '/@/core/ipfs';
import {IPFSFile} from '/@/util/ipfsFile';

const simpleProgramMeta: ProgramMeta = {
  name: 'SimpleApp',
  desc: 'Simple App',
  author: 'WayZer',
  icon: '/favicon.ico',
  ext: {},
  permissions: [],
  databases: [],
  services: {},
};

export async function simpleProgram(): Promise<[CID, ProgramMeta]> {
  const files = CoreIPFS.inst.files;
  const tmp = '/tmp/simple';
  await files.mkdir(tmp, {parents: true});
  await files.write(tmp + '/index.html', 'Hello World!', {create: true});
  await files.write(tmp + '/app.json', JSON.stringify(simpleProgramMeta), {create: true});
  const cid = (await files.stat(tmp)).cid;
  await files.rm(tmp, {recursive: true});
  return [cid, simpleProgramMeta];
}

/**
 * @param program default is simpleProgram
 * NOT fill: fork,databases
 */
export async function simpleAppMeta(program?: CID): Promise<AppMeta> {
  let programMeta: ProgramMeta;
  if (program) {
    programMeta = await new IPFSFile(`/ipfs/${program}/app.json`).asJsonConfig<ProgramMeta>().get();
  } else {
    [program, programMeta] = await simpleProgram();
  }
  return {
    name: programMeta.name,
    desc: programMeta.desc,
    icon: programMeta.icon,
    ext: programMeta.ext,

    creator: CoreIPFS.libp2p.peerId.toB58String(),
    updated: Date.now(),
    databases: {},
    program,
  };
}
