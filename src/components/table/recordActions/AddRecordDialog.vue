<template>
    <Dialog v-model:visible="visible" modal header="新增成績紀錄" :style="{ width: '90vw', maxWidth: '400px' }">
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
                <InputNumber
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
                v-if="selectedSongData"
                label="重新輸入"
                icon="pi pi-refresh"
                outlined
                severity="secondary"
                @click="clearSelection"
                class="btn-nowrap"
            />
            <Button label="取消" icon="pi pi-times" outlined severity="secondary" @click="close" />
            <Button label="確認新增" icon="pi pi-check" @click="save" />
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, useTemplateRef } from 'vue';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';
import { debounce } from 'lodash';
import { algoliasearch } from 'algoliasearch';
import { Difficulty } from "../../../record";

const searchClient = algoliasearch('UIKBGM1GZF', 'eb80677b06c782de84ff19151fe82ba0');

const visible = defineModel('visible', { type: Boolean, default: false });
const emit = defineEmits(['save']);

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

// Watch visible state to reset form
watch(visible, (newVal) => {
    if (newVal) {
        resetForm(true);
    }
});

const performSearch = async () => {
    if (!searchQuery.value.trim()) {
        showSuggestions.value = false;
        filteredSongs.value = [];
        return;
    }

    try {
        const { results } = await searchClient.search({
            requests: [
                {
                    indexName: 'arcaea_constants',
                    query: searchQuery.value,
                    hitsPerPage: 8,
                },
            ],
        });
        // The `results` array from a multiple query can contain different types of responses.
        // We need a type guard to ensure we are dealing with a standard search response that contains 'hits'.
        const searchResult = results[0];
        if (searchResult && 'hits' in searchResult) {
            filteredSongs.value = searchResult.hits;
        } else {
            filteredSongs.value = [];
        }
        showSuggestions.value = filteredSongs.value.length > 0;
    } catch (error) {
        console.error('Algolia 搜尋失敗:', error);
        filteredSongs.value = [];
        showSuggestions.value = false;
    }
};

const debouncedSearch = debounce(performSearch, 300);

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

const close = () => {
    visible.value = false;
};

const save = () => {
    emit('save', {
        ...form.value,
        autoUpdate: !!selectedSongData.value
    });
};
</script>

<style scoped>
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
    color: #374151; /* gray-700 */
}

.help-text {
    color: #6b7280; /* gray-500 */
    font-size: 0.875rem;
}

.auto-update-badge {
    color: #2563eb; /* blue-600 */
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
    background-color: rgba(239, 246, 255, 0.5) !important; /* blue-50 帶透明度 */
    border-color: #93c5fd !important; /* blue-300 */
}

/* 下拉選單與搜尋建議 */
.suggestions-dropdown {
    position: absolute;
    width: 100%;
    background-color: #ffffff;
    border: 1px solid #e5e7eb;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
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
    border-bottom: 1px solid #f3f4f6;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: background-color 0.2s;
}

.suggestion-item:last-child {
    border-bottom: none;
}

.suggestion-item:hover {
    background-color: #eff6ff; /* blue-50 */
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
}

.suggestion-aliases {
    font-size: 0.75rem;
    color: #6b7280;
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
</style>