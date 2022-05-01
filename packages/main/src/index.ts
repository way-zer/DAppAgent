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

ElectronHelper.init();

// Auto-updates
if (import.meta.env.PROD) {
    app.whenReady()
        .then(() => import('electron-updater'))
        .then(({autoUpdater}) => autoUpdater.checkForUpdatesAndNotify())
        .catch((e) => console.error('Failed check updates:', e));
}

