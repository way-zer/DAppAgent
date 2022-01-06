import {app, BrowserWindow, Menu, protocol, Tray} from 'electron';
import {URL} from 'url';
import {request} from 'http';
import globalConfig from 'config';
// import icon from 'config/buildResources/icon.png?url';
import {useService} from '/@/apis/services';
import {bootstrap} from '../main';

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
    app.on('second-instance', () => {
      const window = this.running[Symbol.iterator]().next().value;
      if (window) {
        if (window.isMinimized()) window.restore();
        window.focus();
      }
    });
  }

  static async afterReady() {
    await this.setTray();
    protocol.registerStreamProtocol('dapp', (req, callback) => {
      const url = new URL(req.url);
      const req2 = request(`http://127.0.0.1:${globalConfig.main.port}${url.pathname}`,{
        method: req.method,
        headers: Object.assign({},req.headers,{'Host': new URL(req.url).hostname + '.dapp'}),
      }, callback);
      req2.on('error', (err) => {
        throw err;
      });
      req2.write((req.uploadData||[])[0]?.bytes||"")
      req2.end();
    });
    await bootstrap();
  }

  static async setTray() {
    const tray = new Tray(iconPath);
    tray.setTitle('DappAgent');
    tray.setContextMenu(Menu.buildFromTemplate([
      {
        label: '打开主窗口', click: () => {
          this.createWindow(globalConfig.renderer.url).catch(e => {
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
    window.on('close', () => this.running.delete(window));
    this.running.add(window);
    await window.loadURL(url);
  }
}
