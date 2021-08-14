import {defineConfig} from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'
import hooks from '@midwayjs/vite-plugin-hooks'
import path = require('path')

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [hooks(), reactRefresh()],
    root: 'frontend',
    resolve: {
        alias: {
            '@api': path.join(__dirname, 'src/apis/lambda'),
        },
    },
    server: {
        fs: {
            allow: ['..'],
        },
    },
})