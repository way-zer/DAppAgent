// Write a value to an environment variable to pass it to the main process.
const {createLogger, build} = require('vite');
const {spawn} = require('child_process');
const electronPath = require('electron');

const mode = process.env.MODE = process.env.MODE || 'development';
process.env.VITE_DEV_SERVER_URL ||= `http://localhost:3001/`;

/** @type {import('vite').LogLevel} */
const LOG_LEVEL = 'info';
const logger = createLogger(LOG_LEVEL, {
  prefix: '[main]',
});


/**
 *
 * @param {{name: string; configFile: string; writeBundle: import('rollup').OutputPlugin['writeBundle'] }} param0
 * @returns {import('rollup').RollupWatcher}
 */
const getWatcher = ({name, configFile, writeBundle}) => {
  return build({
    mode,
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
