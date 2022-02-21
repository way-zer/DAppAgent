/* eslint-env node */

import {join} from 'path';
import dappAgent from '@dapp-agent/vite-plugin';
import vue from '@vitejs/plugin-vue';
import {defineConfig} from 'vite';

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [vue(), dappAgent()],
  resolve: {
    alias: {
      '/@/': join(__dirname, 'src/'),
    },
  },
  build: {
    sourcemap: true,
  },
});

