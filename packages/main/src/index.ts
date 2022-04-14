import {app} from 'electron';
import {ElectronHelper} from '/@/core/electron';
import * as SourceMap from 'source-map-support';

SourceMap.install();

const isSingleInstance = app.requestSingleInstanceLock();

if (!isSingleInstance) {
    app.quit();
    process.exit(0);
}

app.disableHardwareAcceleration();

// Install "Vue.js devtools"
// if (isDevelopment) {
//   app.whenReady()
//     .then(() => import('electron-devtools-installer'))
//     .then(({default: installExtension, VUEJS3_DEVTOOLS}) => installExtension(VUEJS3_DEVTOOLS, {
//       loadExtensionOptions: {
//         allowFileAccess: true,
//       },
//     }))
//     .catch(e => console.error('Failed install extension:', e));
// }


// app.on('web-contents-created', (_event, contents) => {
//   /**
//    * Block navigation to origins not on the allowlist.
//    *
//    * Navigation is a common attack vector. If an attacker can convince the app to navigate away
//    * from its current page, they can possibly force the app to open web sites on the Internet.
//    *
//    * @see https://www.electronjs.org/docs/latest/tutorial/security#13-disable-or-limit-navigation
//    */
//   contents.on('will-navigate', (event, url) => {
//     const allowedOrigins: ReadonlySet<string> =
//       new Set<`https://${string}`>(); // Do not use insecure protocols like HTTP. https://www.electronjs.org/docs/latest/tutorial/security#1-only-load-secure-content
//     const {origin, hostname} = new URL(url);
//     const isDevLocalhost = isDevelopment && hostname === 'localhost'; // permit live reload of index.html
//     if (!allowedOrigins.has(origin) && !isDevLocalhost) {
//       console.warn('Blocked navigating to an unallowed origin:', origin);
//       event.preventDefault();
//     }
//   });
//
//   /**
//    * Hyperlinks to allowed sites open in the default browser.
//    *
//    * The creation of new `webContents` is a common attack vector. Attackers attempt to convince the app to create new windows,
//    * frames, or other renderer processes with more privileges than they had before; or with pages opened that they couldn't open before.
//    * You should deny any unexpected window creation.
//    *
//    * @see https://www.electronjs.org/docs/latest/tutorial/security#14-disable-or-limit-creation-of-new-windows
//    * @see https://www.electronjs.org/docs/latest/tutorial/security#15-do-not-use-openexternal-with-untrusted-content
//    */
//   contents.setWindowOpenHandler(({url}) => {
//     const allowedOrigins: ReadonlySet<string> =
//       new Set<`https://${string}`>([ // Do not use insecure protocols like HTTP. https://www.electronjs.org/docs/latest/tutorial/security#1-only-load-secure-content
//         'https://vitejs.dev',
//         'https://github.com',
//         'https://v3.vuejs.org']);
//     const {origin} = new URL(url);
//     if (allowedOrigins.has(origin)) {
//       shell.openExternal(url);
//     } else {
//       console.warn('Blocked the opening of an unallowed origin:', origin);
//     }
//     return {action: 'deny'};
//   });
//
//   /**
//    * Block requested permissions not on the allowlist.
//    *
//    * @see https://www.electronjs.org/docs/latest/tutorial/security#5-handle-session-permission-requests-from-remote-content
//    */
//   contents.session.setPermissionRequestHandler((webContents, permission, callback) => {
//     const origin = new URL(webContents.getURL()).origin;
//     const allowedOriginsAndPermissions: Map<string, Set<string>> =
//       new Map<`https://${string}`, Set<string>>([
//         //['https://permission.site', new Set(['notifications', 'media'])],
//       ]);
//     if (allowedOriginsAndPermissions.get(origin)?.has(permission)) {
//       callback(true);
//     } else {
//       console.warn(`${origin} requested permission for '${permission}', but was blocked.`);
//       callback(false);
//     }
//   });
//
// });

ElectronHelper.init();

// Auto-updates
if (import.meta.env.PROD) {
    app.whenReady()
        .then(() => import('electron-updater'))
        .then(({autoUpdater}) => autoUpdater.checkForUpdatesAndNotify())
        .catch((e) => console.error('Failed check updates:', e));
}

