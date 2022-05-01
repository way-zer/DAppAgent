import {
    app,
    BrowserWindow,
    dialog,
    Menu,
    protocol,
    Tray,
    UploadRawData,
    UploadFile,
} from 'electron';
import {URL} from 'url';
import {request} from 'http';
import globalConfig from 'config/main.json';
// import icon from 'config/buildResources/icon.png?url';
import {CoreIPFS} from '/@/core/ipfs';
import {DBManager} from '/@/core/db';
import {Apis} from '/@/apis';
import {AppManager} from '/@/core/apps';
import * as fs from 'fs';

let iconPath, preloadPath;
if (import.meta.env.DEV) {
    iconPath = '../../builder/buildResources/icon.png';
    preloadPath = '../preload/dist/preload.cjs.js';
} else {
    iconPath = process.resourcesPath + '/icon.png';
    preloadPath = __dirname + '/preload/preload.cjs.js';
}

export class ElectronHelper {
    static running = new Set<BrowserWindow>();
    static tray: Tray;

    static init() {
        protocol.registerSchemesAsPrivileged([
            {
                scheme: 'dapp',
                privileges: {//as https
                    standard: true,
                    secure: true,
                    allowServiceWorkers: true,
                    corsEnabled: true,
                    supportFetchAPI: true,
                    stream: true,
                },
            },
        ]);
        app.on('window-all-closed', () => false);//Keep tray
        app.on('browser-window-created', (_, window) => {
            this.running.add(window);
            window.on('closed', () => this.running.delete(window));
        });
        app.on('second-instance', () => {
            const window = this.running[Symbol.iterator]().next().value;
            if (window) {
                if (window.isMinimized()) window.restore();
                window.focus();
            }
        });
        const startBackend = (async () => {
            await Apis.start();
            await CoreIPFS.start();
            await DBManager.start();
            AppManager.startRepublish();
        })();
        app.whenReady().then(() => this.afterReady());
        Promise.all([startBackend, app.whenReady()]).then(() => this.createWindow());
    }

    static async afterReady() {
        protocol.registerStreamProtocol('dapp', (req, callback) => {
            const url = new URL(req.url);
            const newUrl = req.url.replace(`${url.protocol}//${url.host}`, `http://127.0.0.1:${globalConfig.port}`);
            const req2 = request(newUrl, {
                method: req.method,
                headers: {
                    ...req.headers,
                    'Host': url.hostname + '.dapp',
                    'x-url': req.url,
                },
            }, callback);
            req2.on('error', (err) => {
                throw err;
            });
            // mistake type in electron api
            // @ts-ignore
            req.uploadData?.forEach((it: UploadRawData | UploadFile) => {
                switch (it.type) {
                    case 'rawData':
                        req2.write(it.bytes);
                        break;
                    case 'file':
                        req2.write(fs.readFileSync(it.filePath));
                }
            });
            req2.end();
        });
        await this.setTray();
    }

    static async setTray() {
        const tray = new Tray(iconPath);
        tray.setTitle('DappAgent');
        tray.on('double-click', () => this.createWindow());
        tray.setContextMenu(Menu.buildFromTemplate([
            {label: '打开主窗口', click: () => this.createWindow()},
            {label: '重启', click: this.relaunch},
            {label: '退出', click: app.quit},
        ]));
        tray.on('right-click', () => {
            tray.popUpContextMenu();
        });
        this.tray = tray;
    }

    static relaunch() {
        app.relaunch();
        app.exit();
    }

    static async createWindow(url: string = globalConfig.homeUrl) {
        try {
            const window = new BrowserWindow({
                show: false,
                webPreferences: {
                    nativeWindowOpen: true,
                    // preload: preloadPath
                },
            });
            window.on('ready-to-show', () => window.show());
            window.on('show', () => window.focus());
            await window.loadURL(url);
        } catch (e) {
            await dialog.showMessageBox({
                type: 'error',
                message: 'Fail to create window: ' + e,
            });
        }
    }

    static async selectDir() {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory'],
        });
        return result.canceled ? null : result.filePaths[0];
    }

    static async showConfirmDialog(message: string): Promise<Boolean> {
        const result = await dialog.showMessageBox({
            type: 'question', message,
            buttons: ['确认', '取消'], cancelId: 1,

        });
        return result.response === 0;
    }
}
