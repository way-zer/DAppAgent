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
        app.on('certificate-error', (event, _1, url, _2, _3, callback) => {
            if (new URL(url).host.endsWith('.dapp')) {
                event.preventDefault();
                callback(true);
            }
        });
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
        Promise.all([
            Apis.start(),
            CoreIPFS.start()
                .then(() => AppManager.startRepublish()),
            DBManager.start(),
            app.whenReady().then(() => this.afterReady()),
        ]).then(() => this.createWindow());
    }

    static async afterReady() {
        app.configureHostResolver({
            enableBuiltInResolver: true,
        });
        app.on('session-created', async (session) => {
            await session.setProxy({pacScript: `http://127.0.0.1:${globalConfig.port}/_/pac`});
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
            type: 'warning', message,
            buttons: ['确认', '取消'], cancelId: 1,

        });
        return result.response === 0;
    }
}
