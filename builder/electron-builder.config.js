/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
const config = {
    appId: 'cf.wayzer.DappAgent',
    productName: '蛛网 DappAgent',

    npmRebuild: false,
    directories: {
        output: 'dist',
        buildResources: 'buildResources',
    },
    files: [
        './package.json',
        {from: '../packages/main/dist', to: './'},
        // {from: '../packages/preload/dist', to: './preload'},
    ],
    extraResources: [
        {from: 'buildResources', to: './'},
    ],
};

module.exports = config;
