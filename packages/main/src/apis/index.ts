import {DarukServer} from 'daruk';
import assert from 'assert';
import http from 'http';
import https from 'https';
import key from 'config/ssl.key?raw';
import cert from 'config/ssl.crt?raw';
import globalConfig from '/@/config';
import {AddressInfo} from 'net';

export const Apis = {
    async start() {
        const daruk = DarukServer({
            middlewareOrder: ['boom'],
        });

        // const cores = import.meta.globEager('./core/**/*.ts');
        const apis = import.meta.globEager('./**/*.ts');
        assert(apis);

        await daruk.binding();
        let httpsServer = https.createServer({key, cert}, daruk.app.callback());
        daruk.httpServer = httpsServer;
        daruk.emit('serverReady', daruk.httpServer);

        const server = http.createServer()
            .on('request', daruk.app.callback())
            .on('connect', (req, socket, head) => {
                if (req.url!!.split(':')[0].endsWith('.dapp')) {
                    socket.write(`HTTP/${req.httpVersion} 200 Connection established\r\n\r\n`);

                    httpsServer.emit('connection', socket);
                } else console.log('OTHER ' + req.url);
            })
            .listen(globalConfig.port, () => {
                globalConfig.port = (server.address() as AddressInfo).port;
                console.log('Gateway listen on', globalConfig.port);
            });
    },
};
