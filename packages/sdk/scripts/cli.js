#!/usr/bin/env node
process.env['IPFS_PATH'] = '../main/DAppAgent';

const debug = require('debug');
const {getIpfs, getRepoPath, print} = require('ipfs-cli/utils');
const {cli} = require('ipfs-cli');

/**
 * @param {any} err
 * @param {string} origin
 */
const onUncaughtException = (err, origin) => {
  if (!origin || origin === 'uncaughtException') {
    console.error(err);
    process.exit(1);
  }
};

/**
 * Handle any uncaught errors
 *
 * @param {any} err
 */
const onUnhandledRejection = (err) => {
  console.error(err);
  process.exit(1);
};

process.once('uncaughtException', onUncaughtException);
process.once('unhandledRejection', onUnhandledRejection);

if (process.env.DEBUG) {
  process.on('warning', err => {
    console.error(err.stack);
  });
}

const log = debug('ipfs:cli');


let exitCode = 0;
let ctx = {
  print,
  getStdin: () => process.stdin,
  repoPath: getRepoPath(),
  cleanup: () => {
  },
  isDaemon: false,
  /** @type {import('ipfs-core-types').IPFS | undefined} */
  ipfs: undefined,
};

async function handleCommand(command) {
  try {
    const data = await cli(command, async (argv) => {
      if (!ctx.ipfs) {
        // @ts-ignore argv as no properties in common
        const {ipfs, isDaemon, cleanup} = await getIpfs(argv);

        ctx = {
          ...ctx,
          ipfs,
          isDaemon,
          cleanup,
        };
      }

      argv.ctx = ctx;

      return argv;
    });

    if (data) {
      print(data);
    }
  } catch (/** @type {any} */ err) {
    if (err.code === 'ERR_INVALID_REPO_VERSION') {
      err.message = 'Incompatible repo version. Migration needed. Pass --migrate for automatic migration';
    }

    if (err.code === 'ERR_NOT_ENABLED') {
      err.message = `no IPFS repo found in ${ctx.repoPath}.\n please run: 'ipfs init'`;
    }

    // Handle yargs errors
    if (err.code === 'ERR_YARGS') {
      err.yargs.showHelp();
      ctx.print.error('\n');
      ctx.print.error(`Error: ${err.message}`);
    } else if (log.enabled) {
      // Handle commands handler errors
      log(err);
    } else {
      ctx.print.error(err.message);
    }

    exitCode = 1;
  }
}

if (process.argv[2]) {
  (async ()=>{
    try {
      await handleCommand(process.argv.slice(2));
    } finally {
      ctx.cleanup();
    }
  })().then()
} else {
  console.log("now in interactive cli.")
  process.stdin.on('data', data => {
    handleCommand(data.toString()).then();
  });

  process.on('exit', function () {
    ctx.cleanup();
  });
}
