#!/usr/bin/env node

//note: need execute in frontend module

const {createServer, build} = require('vite');


/** @type 'production' | 'development'' */
const mode = process.env.MODE = process.env.MODE || 'development';
const appHost = process.argv[2] || 'test.dev.dapp';

// const getWatcher = ({name, configFile, writeBundle}) => {
//   return build({
//     mode,
//     configFile,
//     plugins: [{name, writeBundle}],
//   });
// };


// /**
//  * Start or restart App when source files are changed
//  * @param {import('vite').ViteDevServer} viteDevServer
//  * @returns {Promise<import('vite').RollupOutput | Array<import('vite').RollupOutput> | import('vite').RollupWatcher>}
//  */
// const setupPreloadPackageWatcher = (viteDevServer) => {
//   return getWatcher({
//     name: 'reload-page-on-preload-package-change',
//     configFile: '../preload/vite.config.js',
//     writeBundle() {
//       viteDevServer.ws.send({
//         type: 'full-reload',
//       });
//     },
//   });
// };

(async () => {
  try {
    const viteDevServer = await createServer({
      mode,
      server: {
        proxy: {
          '/api/': {
            target: 'http://localhost:7001',
            toProxy: true,
            headers: {
              'host': appHost,
            },
          },
          '/ipfs/': {
            target: 'http://localhost:7001',
            toProxy: true,
            headers: {
              'host': appHost,
            },
          },
        },
      },
      configFile: './vite.config.ts',
    });

    await viteDevServer.listen();

    // await setupPreloadPackageWatcher(viteDevServer);
  } catch (e) {
    console.error(e);
  }
})();
