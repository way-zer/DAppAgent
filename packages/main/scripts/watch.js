// Write a value to an environment variable to pass it to the main process.
const {createLogger, build} = require('vite');
const {spawn} = require('child_process');
const electronPath = require('electron');
const {rmdirSync} = require('fs');

const mode = process.env.MODE = process.env.MODE || 'development';

/** @type {import('vite').LogLevel} */
const LOG_LEVEL = 'info';
const logger = createLogger(LOG_LEVEL, {
  prefix: '[main]',
});

const getWatcher = ({name, configFile, writeBundle}) => {
  return build({
    mode,
    build: {watch: {}},
    configFile,
    plugins: [{name, writeBundle}],
  });
};

/** @type {ChildProcessWithoutNullStreams | null} */
let spawnProcess = null;
getWatcher({
  name: 'reload-app-on-main-package-change',
  configFile: './vite.config.js',
  writeBundle() {
    if (spawnProcess !== null) {
      spawnProcess.kill('SIGINT');
      spawnProcess = null;
      try {
        rmdirSync('DAppAgent/repo.lock');
      } catch (e) {
      }
    }

    spawnProcess = spawn(String(electronPath), ['.']);
    spawnProcess.stdout.on('data', d => d.toString().trim() && logger.warn(d.toString(), {timestamp: true}));
    spawnProcess.stderr.on('data', d => {
      const data = d.toString().trim();
      if (!data) return;
      // const mayIgnore = stderrFilterPatterns.some((r) => r.test(data));
      // if (mayIgnore) return;
      logger.error(data, {timestamp: true});
    });
  },
});
