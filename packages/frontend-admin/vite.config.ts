import {defineConfig} from 'vite';
import reactRefresh from '@vitejs/plugin-react-refresh';
import dappAgent from '@dapp-agent/vite-plugin';
import {join} from 'path';


// https://vitejs.dev/config/
export default defineConfig({
    server: {
        port: 3000,
    },
    plugins: [reactRefresh(), dappAgent({
        appHost: 'admin.sys.dapp',
    })],
    resolve: {
        alias: [
            {find: /^@api/, replacement: join(__dirname, 'src/api')},
            {find: /^~/, replacement: ''},
        ],
    },
    css: {
        preprocessorOptions: {
            less: {
                javascriptEnabled: true,
            },
        },
    },
});
