require('ts-node').register();
const {CoreIPFS} = require('../src/core/ipfs');

setTimeout(async () => {
  await CoreIPFS.start();
  const inst = CoreIPFS.inst;

  const obj = {
    b: [1, 2, 3],
    a: 1,
    c: {
      ca: [5, 6, 7],
      cb: 'foo',
    },
  };
  const cid = await inst.dag.put(obj);
  console.log(cid);
  console.log(await inst.dag.get(cid));

  async function putDag(path, v) {
    let cid = await inst.dag.put(v);
    try {
      await inst.files.rm(path);
    } catch (e) {
    }
    await inst.files.cp(cid, path, {parents: true});
  }

  async function getDag(path) {
    let cid = (await inst.files.stat(path)).cid;
    return [(await inst.dag.get(cid)).value, cid];
  }

  await putDag('/tmp', obj);
  console.log(await getDag('/tmp'));

  require('repl').start('> ').context = {
    ipfs: inst, putDag, getDag,
  };
});
