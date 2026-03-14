import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

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

})


