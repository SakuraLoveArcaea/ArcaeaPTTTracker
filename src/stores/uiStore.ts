import {defineStore} from "pinia";
import {useToast} from "primevue";

export const useUIStore = defineStore("UI",() => {
    const toast = useToast()
    const showToast = (severity: 'success' | 'info' | 'warn' | 'error', summary: string, detail: string, life = 3000) => {
        toast.add({ severity, summary, detail, life });
    };

    return {
        showToast
    }

})