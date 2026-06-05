import { defineStore } from "pinia";
import { useToast } from "primevue";
import { ref } from "vue";
import { Record } from "@/utils/record";

export const useUIStore = defineStore("UI", () => {
    // dialog state
    const isDeleteDialogOpen = ref(false);
    const isAddDialogOpen = ref(false);
    const isImportDialogOpen = ref(false);
    const isExportDialogOpen = ref(false);
    const isMergeDialogOpen = ref(false);
    const editingRecord = ref<Record | null>(null);
    
    // 行動版圖表跳轉與定位狀態
    const activeTab = ref('table');
    const expandedRecordId = ref<string | null>(null);
    const highlightedRecordId = ref<string | null>(null);

    // 主題狀態 (Day / Night Theme)
    const isDarkTheme = ref(true); // 預設為暗色系電競風

    const toast = useToast();
    const showToast = (severity: 'success' | 'info' | 'warn' | 'error', summary: string, detail: string, life = 3000) => {
        toast.add({ severity, summary, detail, life });
    };

    // 初始化顏色主題
    const initTheme = () => {
        const savedTheme = localStorage.getItem('arcaea_theme_preference');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        // 如果有儲存的偏好則優先使用，否則使用系統設定
        const shouldBeDark = savedTheme !== null ? (savedTheme === 'dark') : systemPrefersDark;

        isDarkTheme.value = shouldBeDark;
        const html = document.documentElement;
        if (shouldBeDark) {
            html.classList.add('p-dark');
        } else {
            html.classList.remove('p-dark');
        }
    };

    // 切換顏色主題
    const toggleTheme = () => {
        isDarkTheme.value = !isDarkTheme.value;
        const html = document.documentElement;
        if (isDarkTheme.value) {
            html.classList.add('p-dark');
            localStorage.setItem('arcaea_theme_preference', 'dark');
        } else {
            html.classList.remove('p-dark');
            localStorage.setItem('arcaea_theme_preference', 'light');
        }
    };

    return {
        showToast,
        isDeleteDialogOpen,
        isAddDialogOpen,
        isImportDialogOpen,
        isExportDialogOpen,
        isMergeDialogOpen,
        editingRecord,
        activeTab,
        expandedRecordId,
        highlightedRecordId,
        isDarkTheme,
        initTheme,
        toggleTheme
    };
});