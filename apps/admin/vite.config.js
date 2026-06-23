import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueDevTools from 'vite-plugin-vue-devtools'
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        VueDevTools(),
        vue()
    ],
    base: '/ArcaeaPTTTracker/admin/',
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
            '@tracker/shared': resolve(__dirname, '../../packages/shared/src')
        },
    },
    server: {
        port: 5175
    }
})
