import { defineStore } from "pinia";
import { useToast } from "primevue/usetoast";
import { ref, nextTick } from "vue";
import { Record, Difficulty } from "@tracker/shared/utils/record";
import { useMediaQuery } from "@vueuse/core";

export const useUIStore = defineStore("UI", () => {
    // dialog state
    const isAddDialogOpen = ref(false);
    const isImportDialogOpen = ref(false);
    const editingRecord = ref<Record | null>(null);
    const prefilledSong = ref<any | null>(null);
    const prefilledDifficulty = ref<Difficulty | null>(null);
    
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

    // PTT 計算模式設定
    const pttMode = ref<'b30' | 'b50'>('b50');

    // 曲包瀏覽器設定
    const showPstPrs = ref(true);
    const showScoresAboveBadges = ref(true);

    // 安全地在 Store 初始化時獲取 Toast 實例 (Pinia Store 通常在元件的 setup 階段被第一次實例化)
    let toast: any = null;
    try {
        toast = useToast();
    } catch (error) {
        // 捕捉在非 Vue 元件 context 載入時的 inject 錯誤
    }

    const showToast = (severity: 'success' | 'info' | 'warn' | 'error', summary: string, detail: string, life = 5000, recordId?: string) => {
        if (!toast) {
            try {
                toast = useToast();
            } catch (error) {
                // 忽略錯誤
            }
        }
        if (toast) {
            // 若有跳轉紀錄 ID 且未特別設定更長的時間，提供充足的 6 秒供使用者點擊
            const effectiveLife = (recordId && life === 5000) ? 6000 : life;
            toast.add({ 
                severity, 
                summary, 
                detail, 
                life: effectiveLife,
                data: recordId ? { recordId } : undefined
            });
        } else {
            console.warn(`[Toast Guard] UI Context unavailable: [${severity.toUpperCase()}] ${summary} - ${detail}`);
        }
    };

    /**
     * 跳轉至指定成績紀錄，並自動滾動、高亮與展開卡片
     */
    const jumpToRecord = (recordId: string) => {
        if (!recordId) return;

        // 1. 切換分頁到成績表格/清單
        activeTab.value = 'table';

        // 2. 設定展開與選中高亮狀態
        expandedRecordId.value = recordId;
        highlightedRecordId.value = recordId;

        // 3. 等待 DOM 渲染完畢後，執行平滑滾動
        nextTick(() => {
            const scrollAndFocus = () => {
                const cardEl = document.getElementById(`record-card-${recordId}`);
                if (cardEl) {
                    cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return true;
                }
                return false;
            };

            // 嘗試立即滾動，若 element 尚未渲染則於 100ms / 300ms 再次重試
            if (!scrollAndFocus()) {
                setTimeout(scrollAndFocus, 100);
                setTimeout(scrollAndFocus, 300);
            }
        });

        // 4. 2秒後移除高亮效果，觸發動畫漸變復原
        setTimeout(() => {
            if (highlightedRecordId.value === recordId) {
                highlightedRecordId.value = null;
            }
        }, 2000);
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

        const savedShowPstPrs = localStorage.getItem('arcaea_explorer_show_pst_prs');
        showPstPrs.value = savedShowPstPrs !== 'false';

        const savedShowScores = localStorage.getItem('arcaea_explorer_show_scores_above_badges');
        showScoresAboveBadges.value = savedShowScores !== 'false';

        const savedPttMode = localStorage.getItem('arcaea_ptt_mode');
        pttMode.value = (savedPttMode === 'b30' || savedPttMode === 'b50') ? savedPttMode : 'b50';
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
        jumpToRecord,
        isAddDialogOpen,
        isImportDialogOpen,
        editingRecord,
        prefilledSong,
        prefilledDifficulty,
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
        showPstPrs,
        showScoresAboveBadges,
        pttMode,
        isMobile
    };
});