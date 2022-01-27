import {node} from 'config/electron-vendors.config.json';
import {join} from 'path';

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
    outDir: 'dist',
    assetsDir: '.',
    emptyOutDir: true,
    brotliSize: false,
    minify: process.env.MODE !== 'development',

    ssr: true,
    sourcemap: true,
    target: `node${node}`,
    lib: {
      entry: 'src/index.ts',
      formats: ['cjs'],
    },
  },
};

export default config;
