import {AppMeta, ProgramMeta, ProgramMetaStruct} from '/@/core/apps/define';
import {CID} from 'multiformats';
import {CoreIPFS} from '/@/core/ipfs';

const simpleProgramMeta: ProgramMeta = ProgramMetaStruct.create({
    name: 'SimpleApp',
    desc: 'Simple App',
    author: 'WayZer',
    icon: '/ipfs/QmNjyM7BqsP9zVS5fTfZWJ6cDcFr8Bh6mphHdjRo3FJAA5?favicon.png',
    ext: {},
    permissions: [],
    databases: [],
    services: {},
});

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
    if (!program)
        [program] = await simpleProgram();
    return {
        id: 'TO_FILL',
        creator: CoreIPFS.libp2p.peerId.toB58String(),
        updated: Date.now(),
        ext: {},
        databases: {},
        program,
    };
}
