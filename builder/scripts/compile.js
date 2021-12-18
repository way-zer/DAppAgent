const fs = require('fs');
const child_process = require('child_process');

fs.rmSync('./dist', {recursive: true, force: true});
fs.cpSync('../packages/main/dist', './dist', {recursive: true});
fs.cpSync('../packages/preload/dist', './dist/preload', {recursive: true});

//pnpm workspace file
wFile = '../pnpm-workspace.yaml';
wFileBak = wFile + '.bak';
if (fs.existsSync(wFile))
  fs.renameSync(wFile, wFileBak);

child_process.execSync('pnpm i', {stdio: 'inherit'});
child_process.execSync('electron-builder build --config electron-builder.config.js --dir', {stdio: 'inherit'});

if (fs.existsSync(wFileBak))
  fs.renameSync(wFileBak, wFile);
