const fs = require('fs');
const child_process = require('child_process');

fs.rmSync('./dist', {recursive: true, force: true});
fs.cpSync('../packages/main/dist', './dist', {recursive: true});
fs.cpSync('../packages/preload/dist', './dist/preload', {recursive: true});

child_process.execSync('pnpm i --ignore-workspace --config.node-linker=hoisted', {stdio: 'inherit'});
child_process.execSync('electron-builder build --config electron-builder.config.js --dir', {stdio: 'inherit'});
