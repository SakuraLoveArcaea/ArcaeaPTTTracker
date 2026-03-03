import { createApp } from 'vue';
import App from './App.vue';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura'; // PrimeVue 4 的新主題，外觀很現代
import ToastService from 'primevue/toastservice';

import './style.css'; // 包含 Tailwind 的 CSS

const app = createApp(App);
app.use(PrimeVue, {
    theme: {
        preset: Aura
    }
});
app.use(ToastService);
app.mount('#app');