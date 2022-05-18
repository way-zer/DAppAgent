import defaultConfig from 'config/main.config.js';

let config = defaultConfig;
if (import.meta.env.DEV) {
    import('config/main.dev.config.js')
        .then(it => config = it.default)
        .catch(() => null);
}

export default config;