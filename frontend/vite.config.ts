import {defineConfig} from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'
import path from 'path'


// https://vitejs.dev/config/
export default defineConfig({
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:7001',
                toProxy: true,
                headers: {
                    'host': 'test.dev.dapp',
                },
            },
        },
    },
    plugins: [reactRefresh()],
    resolve: {
        alias: {
            '@api': path.join(__dirname, 'src/api'),
        },
    },
})