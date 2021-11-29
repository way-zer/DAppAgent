import { builtinModules } from 'module'
import { join } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
    resolve: {
        alias: {
            '@': join(__dirname, 'src/'),
        }
    },
    build: {
        sourcemap: 'inline',
        outDir: 'dist/main',
        assetsDir: 'src/assets',
        minify: process.env.MODE !== 'development',
        lib: {
            entry: "src/main.ts",
            name: "main"
        },
        rollupOptions: {
            external: [
                'electron',
                'electron-devtools-installer',
                ...builtinModules,
            ],
            output: {
                entryFileNames: '[name].cjs',
            },
        },
        emptyOutDir: true,
    }
})