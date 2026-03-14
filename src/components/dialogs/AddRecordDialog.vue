<template>
    <Dialog v-model:visible="visible" modal header="新增成績紀錄" :style="{ width: '90vw', maxWidth: '400px' }">
        <div class="flex flex-col gap-4 mt-2">
            <div class="flex flex-col gap-2 relative">
                <label class="font-bold text-gray-700">標題 (Title) 或別名</label>
                <!-- Custom AutoComplete/Search Box -->
                <div class="relative">
                    <InputText v-model="searchQuery" @input="onSearchInput" placeholder="輸入曲名或別名 (例如: 風暴)" fluid autocomplete="off" />
                    <div v-if="showSuggestions && filteredSongs.length > 0" class="suggestions-dropdown absolute w-full bg-white border border-gray-200 shadow-lg rounded-md mt-1 z-50 max-h-60 overflow-y-auto">
                        <div v-for="(song, idx) in filteredSongs" :key="idx" @click="selectSong(song)" class="suggestion-item p-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0">
                            <div class="font-bold text-sm">{{ song.title }}</div>
                            <div class="text-xs text-gray-500 truncate" v-if="song.aliases && song.aliases.length">
                                {{ song.aliases.join(', ') }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="flex flex-col gap-2">
                <label class="font-bold text-gray-700">難度</label>
                <Select v-model="form.difficulty" :options="availableDifficulties" @change="onDifficultyChange" fluid />
            </div>
            
            <div class="flex flex-col gap-2">
                <label class="font-bold text-gray-700">定數 (Constant)</label>
                <InputNumber v-model="form.constant" :minFractionDigits="1" :maxFractionDigits="1" fluid />
            </div>
            
            <div class="flex flex-col gap-2">
                <label class="font-bold text-gray-700">分數 (Score)</label>
                <InputNumber v-model="form.score" :minFractionDigits="0" :maxFractionDigits="4" placeholder="例如: 9939932 或 993.9932" fluid />
                <small class="text-gray-500">支援輸入完整分數，系統將自動轉換。</small>
            </div>
        </div>
        <template #footer>
            <Button label="取消" icon="pi pi-times" outlined severity="secondary" @click="close" />
            <Button label="確認新增" icon="pi pi-check" @click="save" />
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';
import { debounce } from 'lodash';
import { algoliasearch } from 'algoliasearch';
import { Difficulty } from "../../data";

const searchClient = algoliasearch('UIKBGM1GZF', 'eb80677b06c782de84ff19151fe82ba0');

const visible = defineModel('visible', { type: Boolean, default: false });
const emit = defineEmits(['save']);

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

// Watch visible state to reset form
watch(visible, (newVal) => {
    if (newVal) {
        form.value = { title: '', difficulty: 'FTR', constant: 10.0, score: null };
        searchQuery.value = '';
        showSuggestions.value = false;
        selectedSongData.value = null;
        availableDifficulties.value = [...allDifficulties];
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
        filteredSongs.value = results[0].hits;
        showSuggestions.value = filteredSongs.value.length > 0;
    } catch (error) {
        console.error('Algolia 搜尋失敗:', error);
        filteredSongs.value = [];
        showSuggestions.value = false;
    }
};

const debouncedSearch = debounce(performSearch, 300);

const onSearchInput = () => {
    form.value.title = searchQuery.value; // user can still type custom title
    debouncedSearch();
};

const selectSong = (song: any) => {
    searchQuery.value = song.title;
    form.value.title = song.title;
    selectedSongData.value = song;
    showSuggestions.value = false;
    
    // Update available difficulties and constant
    if (song.constants) {
        const diffs = Object.keys(song.constants) as Difficulty[];
        availableDifficulties.value = diffs;
        
        // Auto select highest difficulty available (usually FTR, BYD or ETR)
        let defaultDiff: Difficulty = 'FTR';
        if (diffs.includes('BYD')) defaultDiff = 'BYD';
        else if (diffs.includes('ETR')) defaultDiff = 'ETR';
        else if (diffs.includes('FTR')) defaultDiff = 'FTR';
        else defaultDiff = diffs[0] || 'FTR';
        
        form.value.difficulty = defaultDiff;
        form.value.constant = song.constants[defaultDiff];
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
    emit('save', { ...form.value });
};
</script>

<style scoped>
.suggestions-dropdown {
    max-height: 200px;
}
.suggestion-item {
    transition: background-color 0.2s;
}
</style>
