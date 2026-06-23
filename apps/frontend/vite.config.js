import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from "path";

// https://vite.dev/config/
// use '@'
export default defineConfig({
    plugins: [vue()],
    base: '/ArcaeaPTTTracker/',
    resolve: {
        alias: {
            '@': '/src',
        },
    },
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                admin: resolve(__dirname, 'views.html')
            }
        }
    }

})


