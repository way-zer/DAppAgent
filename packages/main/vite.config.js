import {node} from 'config/vendors.json';
import {join} from 'path';
import {rmdirSync} from 'fs';
import {spawn} from 'child_process';
import electronPath from 'electron';
import {build, createLogger, defineConfig, mergeConfig, Plugin} from 'vite';

const PACKAGE_ROOT = __dirname;

const config = defineConfig({
    mode: process.env.MODE, plugins: [electron()], root: PACKAGE_ROOT,
    resolve: {
        alias: {
            '/@/': join(PACKAGE_ROOT, 'src') + '/',
        },
    },
    build: {
        ssr: true,
        sourcemap: true,
        target: `node${node}`,

        outDir: 'dist',
        assetsDir: '.',
        emptyOutDir: true,
        brotliSize: false,
        minify: true,

        lib: {
            entry: 'src/index.ts', formats: ['cjs'],
        },
    },
    ssr: {
        noExternal: 'config',
        target: 'node',
    },
});

export default config;

/**@return Plugin*/
function electron() {
    const logger = createLogger('info', {
        prefix: '[electron]',
    });
    let enable = false;
    let spawnProcess = null;
    return {
        name: 'electron-dev', enforce: 'pre', config(config, {command, mode}) {
            config.mode = mode;
            if (command === 'serve') {
                enable = true;
                config.build.minify = false;
                config.watch = {};
                build(config).then();
                return new Promise(() => {
                });//never
            }
            return config;
        }, writeBundle() {
            if (spawnProcess !== null) {
                spawnProcess.kill('SIGINT');
                spawnProcess = null;
                try {
                    rmdirSync('DAppAgent/repo.lock');
                } catch (e) {
                }
            }
            if (!enable) return;
            spawnProcess = spawn(String(electronPath), ['.']);
            spawnProcess.stdout.on('data', d => {
                d.toString().trim() && logger.info(d.toString(), {timestamp: true});
            });
            spawnProcess.stderr.on('data', d => {
                d.toString().trim() && logger.info(d.toString(), {timestamp: true});
            });
        },
    };
}
