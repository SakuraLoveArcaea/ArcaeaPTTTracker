import { createApp } from 'vue';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura'; // PrimeVue 4 的新主題，外觀很現代
import ToastService from 'primevue/toastservice';
import { createPinia } from "pinia";
import './style.css'; // 包含 Tailwind 的 CSS


import Home from "./Home.vue"
import { router } from "../router/home.ts"

const app = createApp(Home);

const pinia = createPinia();


app.use(PrimeVue, {
    theme: {
        preset: Aura
    }
});
app.use(ToastService);
app.use(pinia);
app.use(router);
app.mount('#app');