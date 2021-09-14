import {defineConfig} from 'vite'
import {VitePluginNode} from 'vite-plugin-node'

export default defineConfig({
    server: {
        port: 7001,
    },
    plugins: [
        ...VitePluginNode({
            adapter: 'koa',
            appPath: '/src/main.ts',
            exportName: 'app',
            tsCompiler: 'swc',
        }),
    ],
})