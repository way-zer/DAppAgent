#!/usr/bin/env node
const {execSync} = require('child_process');

/** @type 'production' | 'development' */
process.env.MODE = process.env.MODE || 'production';

const packages = [
  'packages/main',
  'packages/preload',
  'packages/renderer',
];


(async () => {
  try {
    const totalTimeLabel = 'Total bundling time';
    console.time(totalTimeLabel);

    for (const p of packages) {

      const consoleGroupName = `${p}/`;
      console.group(consoleGroupName);

      const timeLabel = 'Bundling time';
      console.time(timeLabel);

      execSync('pnpm -C ' + p + ' build', {stdio: [0, 1, 2]});

      console.timeEnd(timeLabel);
      console.groupEnd();
      console.log('\n'); // Just for pretty print
    }
    console.timeEnd(totalTimeLabel);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
