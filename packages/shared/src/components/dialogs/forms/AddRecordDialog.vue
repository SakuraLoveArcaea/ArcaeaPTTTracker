<template>
    <Dialog v-model:visible="visible" modal :dismissableMask="true" :header="dialogHeader" :position="isMobile ? 'top' : 'center'" :style="{ width: '90vw', maxWidth: '400px', maxHeight: '90vh' }">
        <div class="form-container">
            <div class="field-group">
                <div class="field-header">
                    <label class="label-text">標題 (Title) 或別名</label>
                    <small v-if="selectedSongData" class="auto-update-badge">
                        <i class="pi pi-link icon-small"></i> 自動更新已啟用
                    </small>
                </div>

                <div class="input-row">
                    <div class="input-wrapper">
                        <InputText
                            ref="titleInput"
                            v-model="searchQuery"
                            @input="onSearchInput"
                            @keydown="onKeydown"
                            placeholder="輸入曲名或別名 (例如: 風暴)"
                            fluid
                            autocomplete="off"
                            autofocus
                            :readonly="!!selectedSongData"
                            :class="{'input-readonly': !!selectedSongData}"
                        />

                        <div v-if="showSuggestions && filteredSongs.length > 0" class="suggestions-dropdown">
                            <div v-for="(song, idx) in filteredSongs" :key="idx" @click="selectSong(song)" class="suggestion-item">
                                <div class="suggestion-text-wrapper">
                                    <div class="suggestion-title">{{ song.title }}</div>
                                    <div class="suggestion-aliases" v-if="song.aliases && song.aliases.length">
                                        {{ song.aliases.join(', ') }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <small v-if="selectedSongData" class="help-text">已套用資料庫，無法手動修改標題與定數。</small>
                <small v-else class="help-text">自定義模式：可自由輸入並修改標題與定數。</small>
            </div>

            <div class="field-group-spaced">
                <label class="label-text">難度</label>
                <Select v-model="form.difficulty" :options="availableDifficulties" @change="onDifficultyChange" fluid />
            </div>

            <div class="field-group-spaced">
                <label class="label-text">定數 (Constant)</label>
                <InputNumber
                    v-model="form.constant"
                    :minFractionDigits="1"
                    :maxFractionDigits="1"
                    fluid
                    :disabled="!!selectedSongData"
                />
            </div>

            <div class="field-group-spaced">
                <label class="label-text">分數 (Score)</label>
                
                <!-- 快捷鍵盤分數輸入觸發器 -->
                <div 
                    v-if="UIStore.useExperimentalScoreInput" 
                    class="custom-score-display-trigger" 
                    @click="openKeyboard"
                >
                    <span v-if="form.score !== null" class="score-display-val font-monospace">
                        {{ formatScore(form.score) }}
                    </span>
                    <span v-else class="score-placeholder">點擊使用快捷鍵盤輸入分數</span>
                    <i class="pi pi-calculator keyboard-trigger-icon"></i>
                </div>

                <!-- 原生輸入框 -->
                <InputNumber
                    v-else
                    ref="scoreInput"
                    v-model="form.score"
                    :minFractionDigits="0"
                    :maxFractionDigits="4"
                    placeholder="例如: 9939932 或 993.9932"
                    fluid
                    @keydown="onKeydown"
                />
                <small class="help-text">支援輸入完整分數，系統將自動轉換。</small>
            </div>

        </div>

        <template #footer>
            <Button
                v-if="selectedSongData && !UIStore.editingRecord"
                label="重新輸入"
                icon="pi pi-refresh"
                outlined
                severity="secondary"
                @click="clearSelection"
                class="btn-nowrap"
            />
            <Button label="取消" icon="pi pi-times" outlined severity="secondary" @click="close" />
            <Button :label="saveButtonLabel" icon="pi pi-check" @click="save" />
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, useTemplateRef, computed, onMounted, onUnmounted } from 'vue';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';
import { debounce } from 'lodash';
import { Difficulty } from "@tracker/shared/utils/record";
import { useUIStore } from "@tracker/shared/stores/uiStore";
import { fetchAllSongs, searchSongs } from "@tracker/shared/utils/songDatabase";

const visible = defineModel('visible', { type: Boolean, default: false });
const emit = defineEmits(['save']);

const UIStore = useUIStore();

const isMobile = ref(false);
let mediaQuery: MediaQueryList | null = null;

const handleMediaQuery = (e: MediaQueryListEvent | MediaQueryList) => {
    isMobile.value = e.matches;
};

onMounted(() => {
    mediaQuery = window.matchMedia('(max-width: 768px)');
    isMobile.value = mediaQuery.matches;
    mediaQuery.addEventListener('change', handleMediaQuery);
    // 預先載入所有曲目
    fetchAllSongs().catch(err => console.error('預載入曲目失敗:', err));
});

onUnmounted(() => {
    if (mediaQuery) {
        mediaQuery.removeEventListener('change', handleMediaQuery);
    }
});

// 使用 computed 計算 Dialog 標題與按鈕文字
const dialogHeader = computed(() => UIStore.editingRecord ? '修改成績紀錄' : '新增成績紀錄');
const saveButtonLabel = computed(() => UIStore.editingRecord ? '確認修改' : '確認新增');

// 使用 Vue 3.5 新語法綁定 Template Ref
const titleInput = useTemplateRef<any>('titleInput');
const scoreInput = useTemplateRef<any>('scoreInput');

const form = ref({
    title: '',
    difficulty: 'FTR' as Difficulty,
    constant: 10.0,
    score: null as number | null
});

// For Algolia Search
const searchQuery = ref('');
const showSuggestions = ref(false);
const filteredSongs = ref<any[]>([]);
const allDifficulties: Difficulty[] = ['PST', 'PRS', 'FTR', 'BYD', 'ETR'];
const availableDifficulties = ref<Difficulty[]>([...allDifficulties]);
const selectedSongData = ref<any>(null);

// 預留的分裂分數狀態
// const splitScore = ref({ part1: null, part2: null });

// Watch visible state to reset form or prefill edit data
watch(visible, async (newVal) => {
    if (newVal) {
        if (UIStore.editingRecord) {
            // 編輯模式：從 editingRecord 帶入資料
            const record = UIStore.editingRecord;
            form.value = {
                title: record.title,
                difficulty: record.difficulty,
                constant: record.constant,
                score: record.score
            };
            searchQuery.value = record.title;
            // 預填選取的歌曲資料，確保當 autoUpdate 是 true 時，會觸發唯讀鎖定
            selectedSongData.value = record.autoUpdate 
                ? { title: record.title, constants: { [record.difficulty]: record.constant } } 
                : null;

            if (!record.autoUpdate && searchQuery.value.trim()) {
                performSearch();
            }
        } else {
            // 新增模式：重置表單
            if (UIStore.prefilledSong) {
                const targetSong = UIStore.prefilledSong;
                const targetDiff = UIStore.prefilledDifficulty;
                
                await selectSong(targetSong);
                
                if (targetDiff && targetSong.constants && targetSong.constants[targetDiff] !== undefined) {
                    form.value.difficulty = targetDiff;
                    form.value.constant = targetSong.constants[targetDiff];
                }
                
                UIStore.prefilledSong = null;
                UIStore.prefilledDifficulty = null;
            } else {
                resetForm(true);
            }
        }
    }
});

const performSearch = async () => {
    if (!searchQuery.value.trim()) {
        showSuggestions.value = false;
        filteredSongs.value = [];
        return;
    }

    try {
        filteredSongs.value = await searchSongs(searchQuery.value);
        showSuggestions.value = filteredSongs.value.length > 0;
    } catch (error) {
        console.error('搜尋失敗:', error);
        filteredSongs.value = [];
        showSuggestions.value = false;
    }
};

const debouncedSearch = debounce(performSearch, 150);

const onSearchInput = () => {
    form.value.title = searchQuery.value;
    selectedSongData.value = null;
    debouncedSearch();
};

// 處理鍵盤快捷鍵
const onKeydown = async (e: KeyboardEvent) => {
    // 1. 開關模糊搜尋結果 (Cmd/Ctrl + K)
    if ((e.metaKey || e.ctrlKey) && e.code === 'KeyK') {
        e.preventDefault();

        // 只有在已經有搜尋結果的情況下，切換才有意義
        if (filteredSongs.value.length > 0) {
            showSuggestions.value = !showSuggestions.value;
        }
        return;
    }

    // 2. Cmd/Ctrl + 1, 2, 3 自動選擇歌曲 (Focus 邏輯已移至 selectSong 內部)
    if ((e.metaKey || e.ctrlKey) && ['1', '2', '3'].includes(e.key)) {
        e.preventDefault();
        const index = parseInt(e.key) - 1;

        if (showSuggestions.value && filteredSongs.value[index]) {
            // 呼叫 selectSong，它會自動幫我們選歌並 Focus 分數欄位
            selectSong(filteredSongs.value[index]);
        }
        return;
    }

    // 3. 確認 (Enter)
    if (e.code === 'Enter') {
        e.preventDefault();
        save();
    }
};

const selectSong = async (song: any) => {
    searchQuery.value = song.title;
    form.value.title = song.title;
    selectedSongData.value = song;
    showSuggestions.value = false;

    // 更新難度與定數
    if (song.constants) {
        const diffs = Object.keys(song.constants) as Difficulty[];
        availableDifficulties.value = diffs;

        let defaultDiff: Difficulty = 'FTR';
        if (diffs.includes('BYD')) defaultDiff = 'BYD';
        else if (diffs.includes('ETR')) defaultDiff = 'ETR';
        else if (diffs.includes('FTR')) defaultDiff = 'FTR';
        else defaultDiff = diffs[0] || 'FTR';

        form.value.difficulty = defaultDiff;
        form.value.constant = song.constants[defaultDiff];
    }

    // 等待 Vue 更新 DOM 後，自動 Focus 到分數欄位 (不管是點擊還是快捷鍵都會觸發)
    await nextTick();
    if (scoreInput.value) {
        const componentEl = scoreInput.value.$el || scoreInput.value;
        const realInput = componentEl.querySelector ? componentEl.querySelector('input') : componentEl;

        if (realInput && typeof realInput.focus === 'function') {
            realInput.focus();
        }
    }
};

// 重置表單的輔助函式
const resetForm = (fullReset = false) => {
    form.value = { title: '', difficulty: 'FTR', constant: 10.0, score: null };
    searchQuery.value = '';
    showSuggestions.value = false;
    selectedSongData.value = null;
    availableDifficulties.value = [...allDifficulties];
    // splitScore.value = { part1: null, part2: null };
};

// 按下重新輸入時呼叫，完整清空並聚焦標題
const clearSelection = async () => {
    resetForm(true);

    await nextTick();
    if (titleInput.value) {
        const componentEl = titleInput.value.$el || titleInput.value;

        // 預設將目標設為外層元素
        let realInput = componentEl;

        // 如果外層元素本身不是 input，才往裡面尋找 input 標籤
        if (componentEl.tagName !== 'INPUT' && componentEl.querySelector) {
            const innerInput = componentEl.querySelector('input');
            if (innerInput) {
                realInput = innerInput;
            }
        }

        if (realInput && typeof realInput.focus === 'function') {
            realInput.focus();
        }
    }
};

const onDifficultyChange = () => {
    if (selectedSongData.value && selectedSongData.value.constants) {
        const c = selectedSongData.value.constants[form.value.difficulty];
        if (c !== undefined) {
            form.value.constant = c;
        }
    }
};

const formatScore = (score: number | null) => {
    if (score === null) return '';
    const rawScore = score <= 1005 ? Math.round(score * 10000) : Math.round(score);
    return rawScore.toLocaleString();
};

const openKeyboard = () => {
    UIStore.scoreInputRecord = {
        id: 'temp-add-record',
        title: form.value.title || '自定義歌曲',
        difficulty: form.value.difficulty,
        constant: form.value.constant,
        score: form.value.score || 0,
        playPtt: 0
    } as any;
    UIStore.isScoreInputDialogOpen = true;
};

const setScore = (score: number) => {
    form.value.score = score;
};

defineExpose({
    setScore
});

const close = () => {
    visible.value = false;
};

const save = () => {
    emit('save', {
        ...form.value,
        id: UIStore.editingRecord ? UIStore.editingRecord.id : null,
        autoUpdate: !!selectedSongData.value
    });
};
</script>

<style scoped lang="scss">
/* 佈局與間距 */
.form-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 0.5rem;
}

.field-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    position: relative;
}

.field-group-spaced {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.field-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.input-row {
    display: flex;
    gap: 0.5rem;
    align-items: flex-start;
}

.input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    flex: 1;
}

/* 文字樣式 */
.label-text {
    font-weight: bold;
    color: var(--text-color);
}

.help-text {
    color: var(--text-muted);
    font-size: 0.875rem;
}

.auto-update-badge {
    color: #3b82f6;
    font-weight: bold;
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.icon-small {
    font-size: 10px;
}

/* 狀態樣式 */
.input-readonly {
    background-color: rgba(59, 130, 246, 0.08) !important;
    border-color: rgba(59, 130, 246, 0.3) !important;
}

/* 下拉選單與搜尋建議 */
.suggestions-dropdown {
    position: absolute;
    width: 100%;
    background-color: var(--dialog-bg);
    border: 1px solid var(--border-color);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1);
    border-radius: 0.375rem;
    margin-top: 0.25rem;
    top: 100%;
    z-index: 50;
    max-height: 15rem;
    overflow-y: auto;
}

.suggestion-item {
    padding: 0.5rem;
    cursor: pointer;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: background-color 0.2s;
    background: transparent;

    &:last-child {
        border-bottom: none;
    }

    &:hover {
        background-color: var(--options-bg);
    }
}

.suggestion-text-wrapper {
    overflow: hidden;
}

.suggestion-title {
    font-weight: bold;
    font-size: 0.875rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--text-color);
}

.suggestion-aliases {
    font-size: 0.75rem;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* 按鈕與底部操作區 */
.btn-nowrap {
    white-space: nowrap;
}

.footer-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
}

/* 快捷分數輸入顯示器 */
.custom-score-display-trigger {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.55rem 0.75rem;
    background: var(--input-bg);
    border: 1px solid var(--input-border);
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s, border-color 0.2s, box-shadow 0.2s;
    min-height: 2.5rem;
    box-sizing: border-box;

    &:hover {
        border-color: var(--primary);
    }

    .score-display-val {
        font-size: 1rem;
        font-weight: 700;
        color: var(--primary);
        letter-spacing: 0.05em;
    }

    .score-placeholder {
        color: var(--text-muted);
        font-size: 0.875rem;
    }

    .keyboard-trigger-icon {
        color: var(--text-muted);
        font-size: 0.875rem;
        transition: color 0.2s;
    }

    &:hover .keyboard-trigger-icon {
        color: var(--primary);
    }
}
</style>