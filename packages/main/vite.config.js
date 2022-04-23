import {node} from 'config/vendors.json';
import {join} from 'path';
import {rmdirSync} from 'fs';
import {spawn} from 'child_process';
import electronPath from 'electron';
import {build, createLogger, defineConfig, Plugin} from 'vite';

const PACKAGE_ROOT = __dirname;


/**
 * @type {import('vite').UserConfig}
 * @see https://vitejs.dev/config/
 */
const config = {
    mode: process.env.MODE, plugins: [electron()], root: PACKAGE_ROOT, resolve: {
        alias: {
            '/@/': join(PACKAGE_ROOT, 'src') + '/',
        },
    }, build: {
        outDir: 'dist', assetsDir: '.', emptyOutDir: true, brotliSize: false, minify: true,

        lib: {
            entry: 'src/index.ts', formats: ['cjs'],
        },
    },
};

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
            if (command === 'serve') {
                enable = true;
                config.mode = mode;
                config.build.minify = false;
                build(config).then();
                return new Promise(() => {
                });//never
            }
            return defineConfig({
                build: {
                    ssr: true, sourcemap: true, target: `node${node}`, watch: {},
                },
            });
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
