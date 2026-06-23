import { defineStore } from "pinia";
import { useToast } from "primevue/usetoast";
import { ref } from "vue";
import { Record } from "@tracker/shared/utils/record";
import { useMediaQuery } from "@vueuse/core";

export const useUIStore = defineStore("UI", () => {
    // dialog state
    const isAddDialogOpen = ref(false);
    const isImportDialogOpen = ref(false);
    const editingRecord = ref<Record | null>(null);
    
    // 行動版圖表跳轉與定位狀態
    const activeTab = ref('table');
    const expandedRecordId = ref<string | null>(null);
    const highlightedRecordId = ref<string | null>(null);

    // 主題狀態 (Day / Night Theme)
    const isDarkTheme = ref(true); // 預設為暗色系電競風

    // 實驗性功能設定
    const useExperimentalScoreInput = ref(false);
    const isScoreInputDialogOpen = ref(false);
    const scoreInputRecord = ref<Record | null>(null);

    const useExperimentalPttEstimation = ref(false);
    const pttEstimationStartPoint = ref<string>('9500000'); // '9500000' | '9800000'

    // 安全地在 Store 初始化時獲取 Toast 實例 (Pinia Store 通常在元件的 setup 階段被第一次實例化)
    let toast: any = null;
    try {
        toast = useToast();
    } catch (error) {
        // 捕捉在非 Vue 元件 context 載入時的 inject 錯誤
    }

    const showToast = (severity: 'success' | 'info' | 'warn' | 'error', summary: string, detail: string, life = 3000) => {
        if (!toast) {
            try {
                toast = useToast();
            } catch (error) {
                // 忽略錯誤
            }
        }
        if (toast) {
            toast.add({ severity, summary, detail, life });
        } else {
            console.warn(`[Toast Guard] UI Context unavailable: [${severity.toUpperCase()}] ${summary} - ${detail}`);
        }
    };

    // 初始化顏色主題與實驗性功能
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

        // 初始化實驗性功能
        const savedExp = localStorage.getItem('arcaea_experimental_score_input');
        useExperimentalScoreInput.value = savedExp === 'true';

        const savedPttExp = localStorage.getItem('arcaea_experimental_ptt_estimation');
        useExperimentalPttEstimation.value = savedPttExp === 'true';

        const savedPttStart = localStorage.getItem('arcaea_ptt_estimation_start_point');
        pttEstimationStartPoint.value = (savedPttStart === '9500000' || savedPttStart === '9800000') ? savedPttStart : '9500000';
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

    // 切換實驗性功能
    const toggleExperimental = () => {
        useExperimentalScoreInput.value = !useExperimentalScoreInput.value;
        localStorage.setItem('arcaea_experimental_score_input', String(useExperimentalScoreInput.value));
    };

    const isMobile = useMediaQuery('(max-width: 768px)');

    return {
        showToast,
        isAddDialogOpen,
        isImportDialogOpen,
        editingRecord,
        activeTab,
        expandedRecordId,
        highlightedRecordId,
        isDarkTheme,
        initTheme,
        toggleTheme,
        useExperimentalScoreInput,
        isScoreInputDialogOpen,
        scoreInputRecord,
        toggleExperimental,
        useExperimentalPttEstimation,
        pttEstimationStartPoint,
        isMobile
    };
});