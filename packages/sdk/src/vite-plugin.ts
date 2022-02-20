import {mergeConfig, Plugin, UserConfig} from 'vite';

const defaultConfig = {
  backend: 'http://localhost:7001',
  appHost: 'test.dev.dapp',
};

type Options = typeof defaultConfig

export default function dappAgent(option0?: Partial<Options>): Plugin {
  const {backend, appHost} = mergeConfig(defaultConfig, option0 || {}) as Options;
  return {
    name: 'vite-plugin-dappAgent',
    config() {
      return {
        server: {
          proxy: {
            '/api/': {
              target: backend,
              toProxy: true,
              headers: {
                'host': appHost,
              },
            },
            '/ipfs/': {
              target: backend,
              toProxy: true,
              headers: {
                'host': appHost,
              },
            },
          },
        },
        build: {
          target: `chrome96`,
        },
      } as UserConfig;
    },
  };
}
