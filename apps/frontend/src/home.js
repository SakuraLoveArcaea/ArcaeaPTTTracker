import { createApp } from 'vue';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura'; // PrimeVue 4 的新主題，外觀很現代
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';
import { createPinia } from "pinia";
import './style.scss';

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
app.use(ConfirmationService);
app.use(pinia);
app.use(router);
app.mount('#app');