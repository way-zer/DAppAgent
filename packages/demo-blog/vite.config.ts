/* eslint-env node */

import {join} from 'path';
import dappAgent from '@dapp-agent/vite-plugin';
import vue from '@vitejs/plugin-vue';
import components from 'unplugin-vue-components/vite';
import {defineConfig} from 'vite';
import {NaiveUiResolver} from 'unplugin-vue-components/resolvers';

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    components({
      dts: 'src/components.d.ts',
      resolvers: [
        NaiveUiResolver(),
      ],
    }),
    vue(),
    dappAgent({
      appHost: 'blog.dev.dapp',
    }),
  ],
  resolve: {
    alias: {
      '/@': join(__dirname, 'src'),
    },
  },
  build: {
    sourcemap: true,
  },
});

