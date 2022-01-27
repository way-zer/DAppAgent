const fs = require('fs');
const child_process = require('child_process');

fs.rmSync('./dist', {recursive: true, force: true});
fs.cpSync('../packages/main/dist', './dist', {recursive: true});
fs.cpSync('../packages/preload/dist', './dist/preload', {recursive: true});

//update dependencies from main
const packageNow = require('package.json');
const {dependencies} = require('../../packages/main/package.json');
packageNow.dependencies = dependencies;
fs.writeFileSync('./package.json', JSON.stringify(packageNow));
child_process.execSync('pnpm i --ignore-workspace --config.node-linker=hoisted', {stdio: 'inherit'});

child_process.execSync('electron-builder build --config electron-builder.config.js --dir', {stdio: 'inherit'});
