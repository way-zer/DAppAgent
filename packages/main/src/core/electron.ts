import {app, BrowserWindow, dialog, Menu, protocol, Tray} from 'electron';
import {URL} from 'url';
import {request} from 'http';
import globalConfig from 'config/main.json';
// import icon from 'config/buildResources/icon.png?url';
import {useService} from '/@/apis/services';
import {CoreIPFS} from '/@/core/ipfs';
import {DBManager} from '/@/core/db';
import {Apis} from '/@/apis';
import {AppManager} from '/@/core/apps';

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
    setTimeout(async () => {
      await CoreIPFS.start();
      await DBManager.start();
      AppManager.startRepublish();
    });
    app.whenReady().then(() => this.afterReady());
  }

  static async afterReady() {
    await Apis.start();
    protocol.registerStreamProtocol('dapp', (req, callback) => {
      const url = new URL(req.url);
      const req2 = request(`http://127.0.0.1:${globalConfig.port}${url.pathname}`, {
        method: req.method,
        headers: Object.assign({}, req.headers, {'Host': new URL(req.url).hostname + '.dapp'}),
      }, callback);
      req2.on('error', (err) => {
        throw err;
      });
      req2.write((req.uploadData || [])[0]?.bytes || '');
      req2.end();
    });
    await this.setTray();
  }

  static async setTray() {
    const tray = new Tray(iconPath);
    tray.setTitle('DappAgent');
    tray.setContextMenu(Menu.buildFromTemplate([
      {
        label: '打开主窗口', click: () => {
          this.createWindow(globalConfig.homeUrl).catch(e => {
            console.error('Fail to create window', e);
          });
        },
      },
      {
        label: '创建测试应用', click: () => {
          useService('apps').create('test').catch(e => {
            console.error('Fail to create app', e);
          });
        },
      },
      {
        label: '打开测试应用', click: () => {
          this.createWindow('dapp://test.dev').catch(e => {
            console.error('Fail to create window', e);
          });
        },
      },
      {
        label: '退出', click: () => {
          app.quit();
        },
      },
    ]));
    tray.on('right-click', () => {
      tray.popUpContextMenu();
    });
    this.tray = tray;
  }

  static async createWindow(url: string) {
    const window = new BrowserWindow({
      show: false,
      webPreferences: {
        nativeWindowOpen: true,
        // preload: preloadPath
      },
    });
    window.on('ready-to-show', () => window.show());
    await window.loadURL(url);
  }

  static async selectDir() {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    return result.canceled ? null : result.filePaths[0];
  }
}
