import defaultC from './config.default';

let globalConfig = defaultC;
if (process.env.MODE !== 'production') {
  try {
    const overlay = (require('./config.dev')).default;
    globalConfig = Object.assign(globalConfig, overlay);
  } catch (e) {//ignore
  }
}

try {
  const overlay = (require('./config.local')).default;
  globalConfig = Object.assign(globalConfig, overlay);
} catch (e) {//ignore
}

export default globalConfig;
