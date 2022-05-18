const fs = require('fs');
const child_process = require('child_process');

const getPlatform = () => {
    switch (process.platform) {
        case 'darwin':
            return 'mac';
        case 'win32':
            return 'windows';
        default:
            return 'linux';
    }
};

//update dependencies from main
const packageNow = require('./package.json');
const {dependencies} = require('../packages/main/package.json');
delete dependencies['config'];
packageNow.dependencies = dependencies;
packageNow.version = process.env.APP_VERSION || require('./version');

fs.writeFileSync('./package.json', JSON.stringify(packageNow));
child_process.execSync('pnpm i --ignore-workspace --config.node-linker=hoisted', {stdio: 'inherit'});

child_process.execSync('electron-builder build ' +
    '--config electron-builder.config.js ' +
    '--' + getPlatform() + ' ' +
    '--publish always', {stdio: 'inherit'});