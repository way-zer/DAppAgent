import defaultC from './config.default';
import devConfig from './config.dev';

//note: This File must be Inline using vite

let globalConfig = defaultC;
if (import.meta.env.DEV)
  globalConfig = Object.assign(globalConfig, devConfig);

export default globalConfig;
