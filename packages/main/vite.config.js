import {node} from 'config/electron-vendors.config.json';
import {join} from 'path';
import {builtinModules} from 'module';

const PACKAGE_ROOT = __dirname;


/**
 * @type {import('vite').UserConfig}
 * @see https://vitejs.dev/config/
 */
const config = {
  mode: process.env.MODE,
  root: PACKAGE_ROOT,
  resolve: {
    alias: {
      '/@/': join(PACKAGE_ROOT, 'src') + '/',
    },
  },
  build: {
    sourcemap: 'inline',
    target: `node${node}`,
    outDir: 'dist',
    assetsDir: '.',
    minify: process.env.MODE !== 'development',
    lib: {
      entry: 'src/index.ts',
      formats: ['cjs'],
    },
    rollupOptions: {
      // external: (source => {
      //   if (source in builtinModules) return true;
      //   if (source in ['electron', 'electron-devtools-installer']) return true;
      //   if (source in ['ipfs-core', 'orbit-db']) return true;
      //   //include circular in this, result in wrong output
      //   if (source.indexOf('readable-stream') >= 0) return true;
      //   return null;
      // }),
      external: [
        'electron',
        'electron-devtools-installer',

        'ipfs-core',
        'orbit-db',
        'daruk',

        'memoizee',
        /readable-stream.*/,
        ...builtinModules,
      ],
      output: {
        entryFileNames: '[name].cjs',
      },
    },
    emptyOutDir: true,
    brotliSize: false,
  },
};

export default config;
