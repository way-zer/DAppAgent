import {CoreIPFS} from '/@/core/ipfs';
import {CID} from 'multiformats';
import {hashes} from 'multiformats/basics';


export function dagCodec() {
    return CoreIPFS.inst.codecs.getCodec('dag-cbor');
}

export async function dagHash(obj: Object): Promise<CID> {
    const codec = await dagCodec();
    const hash = await hashes.sha256.digest(codec.encode(obj));
    return CID.createV1(codec.code, hash);
}
