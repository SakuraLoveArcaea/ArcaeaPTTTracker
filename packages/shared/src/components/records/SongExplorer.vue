<template>
    <div class="song-explorer-container">
        <!-- 頂部提示與搜尋 -->
        <ExplorerHeader v-model="packSearchQuery" />

        <!-- 載入中狀態 -->
        <div v-if="isLoading" class="loading-state">
            <i class="pi pi-spin pi-spinner loading-spinner"></i>
            <p>正在載入曲目資料庫...</p>
        </div>

        <!-- 曲包資料夾列表 -->
        <div v-else class="packs-list">
            <PackFolder
                v-for="packName in filteredPackNames"
                :key="packName"
                :packName="packName"
                :songs="filteredGroupedSongs[packName] || []"
                :activePack="activePack"
                :activeSubVersion="activeSubVersion"
                :activeSongId="activeSongId"
                :packVersion="packLatestVersions[packName]"
                :memoryArchiveGroupedByVersion="memoryArchiveGroupedByVersion"
                :sortedMemoryArchiveVersions="sortedMemoryArchiveVersions"
                @toggle-pack="togglePack"
                @toggle-subversion="toggleSubVersion"
                @toggle-details="toggleSongDetails"
                @add-record="handleAddRecord"
                @add-record-diff="handleAddRecordWithDiff"
            />

            <!-- 查無結果 -->
            <div v-if="filteredPackNames.length === 0" class="empty-state">
                <i class="pi pi-search-minus empty-icon"></i>
                <p>找不到符合的曲包</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { debounce } from 'lodash';
import { fetchAllSongs, Song } from '@tracker/shared/utils/songDatabase';
import { useUIStore } from '@tracker/shared/stores/uiStore';
import ExplorerHeader from './explorer/ExplorerHeader.vue';
import PackFolder from './explorer/PackFolder.vue';

const UIStore = useUIStore();
const allSongs = ref<Song[]>([]);
const isLoading = ref(true);
const packSearchQuery = ref('');
const debouncedSearchQuery = ref('');

const updateDebouncedSearch = debounce((val: string) => {
    debouncedSearchQuery.value = val;
}, 150);

watch(packSearchQuery, (newVal) => {
    if (!newVal.trim()) {
        debouncedSearchQuery.value = '';
        updateDebouncedSearch.cancel();
    } else {
        updateDebouncedSearch(newVal);
    }
});

const activePack = ref<string | null>(null);
const activeSongId = ref<string | null>(null);
const activeSubVersion = ref<string | null>(null);

onMounted(async () => {
    try {
        allSongs.value = await fetchAllSongs();
    } catch (error) {
        console.error('載入曲目失敗:', error);
    } finally {
        isLoading.value = false;
    }
});

// 根據曲包分組
const groupedSongs = computed(() => {
    const groups: Record<string, Song[]> = {};
    allSongs.value.forEach(song => {
        const pack = song.pack || 'Others';
        if (!groups[pack]) {
            groups[pack] = [];
        }
        groups[pack].push(song);
    });
    return groups;
});

// Memory Archive 專用：按版本分組 (基於搜尋過濾後的曲目)
const memoryArchiveGroupedByVersion = computed(() => {
    const songs = filteredGroupedSongs.value['Memory Archive'] || [];
    const groups: Record<string, Song[]> = {};
    songs.forEach(song => {
        const ver = song.version || 'Others';
        if (!groups[ver]) {
            groups[ver] = [];
        }
        groups[ver].push(song);
    });
    return groups;
});

// 判斷曲目是否符合搜尋條件
const matchSong = (song: Song, query: string): boolean => {
    if (!query) return true;
    
    // 曲名匹配
    if (song.title.toLowerCase().includes(query)) return true;
    
    // 作曲家匹配
    if (song.composer && song.composer.toLowerCase().includes(query)) return true;
    
    // 別名匹配
    if (song.aliases && song.aliases.some(alias => alias.toLowerCase().includes(query))) return true;
    
    // 版本匹配
    if (song.version && song.version.toLowerCase().includes(query)) return true;

    // 曲包匹配 (如果曲包本身就符合 query，則其下所有曲目均算符合，這裡供 matchSong 基本過濾使用)
    if (song.pack && song.pack.toLowerCase().includes(query)) return true;

    return false;
};

// 搜尋過濾後的曲包與曲目對照表
const filteredGroupedSongs = computed(() => {
    const query = debouncedSearchQuery.value.trim().toLowerCase();
    const result: Record<string, Song[]> = {};
    
    for (const [packName, songs] of Object.entries(groupedSongs.value)) {
        // 如果曲包名稱本身就符合搜尋字串，則直接放入所有曲目
        if (query && packName.toLowerCase().includes(query)) {
            result[packName] = songs;
            continue;
        }
        
        // 否則過濾出該曲包中所有符合曲子任何資訊的曲目
        const matched = songs.filter(song => matchSong(song, query));
        if (matched.length > 0) {
            result[packName] = matched;
        }
    }
    return result;
});

// 解析版本號
const parseVersion = (vStr: string): number[] => {
    if (!vStr) return [0, 0, 0];
    return vStr.split('.').map(num => parseInt(num, 10) || 0);
};

// 比較版本號
const compareVersions = (v1: string, v2: string): number => {
    const parts1 = parseVersion(v1);
    const parts2 = parseVersion(v2);
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const p1 = parts1[i] || 0;
        const p2 = parts2[i] || 0;
        if (p1 !== p2) {
            return p1 - p2;
        }
    }
    return 0;
};

// Memory Archive 專用：版本號排序 (降序)
const sortedMemoryArchiveVersions = computed(() => {
    const versions = Object.keys(memoryArchiveGroupedByVersion.value);
    return versions.sort((a, b) => compareVersions(b, a));
});

// 計算每個曲包中最新曲目的版本
const packLatestVersions = computed(() => {
    const versions: Record<string, string> = {};
    for (const [packName, songs] of Object.entries(groupedSongs.value)) {
        let maxVer = '0.0.0';
        songs.forEach(song => {
            const ver = song.version || '0.0.0';
            if (compareVersions(ver, maxVer) > 0) {
                maxVer = ver;
            }
        });
        versions[packName] = maxVer;
    }
    return versions;
});

// 過濾並按照最新版本降序排列曲包名稱
const filteredPackNames = computed(() => {
    const query = debouncedSearchQuery.value.trim().toLowerCase();
    const packs = Object.keys(filteredGroupedSongs.value);
    
    return packs.sort((a, b) => {
        const verA = packLatestVersions.value[a] || '0.0.0';
        const verB = packLatestVersions.value[b] || '0.0.0';
        const cmp = compareVersions(verB, verA); // 降序
        if (cmp !== 0) return cmp;
        return a.localeCompare(b);
    });
});

// 開關曲包折疊 (自動收縮其他)
const togglePack = (packName: string) => {
    if (activePack.value === packName) {
        activePack.value = null;
    } else {
        activePack.value = packName;
        // 切換曲包時，自動摺疊曲目詳細與子版本資料夾
        activeSongId.value = null;
        activeSubVersion.value = null;
    }
};

// 開關 Memory Archive 子版本資料夾 (自動收縮其他)
const toggleSubVersion = (version: string) => {
    if (activeSubVersion.value === version) {
        activeSubVersion.value = null;
    } else {
        activeSubVersion.value = version;
        // 切換版本資料夾時，自動摺疊曲目詳細
        activeSongId.value = null;
    }
};

// 開關曲目詳細折疊 (自動收縮其他)
const toggleSongDetails = (songId: string) => {
    if (activeSongId.value === songId) {
        activeSongId.value = null;
    } else {
        activeSongId.value = songId;
    }
};

// 處理快速新增
const handleAddRecord = (song: Song) => {
    UIStore.prefilledSong = song;
    UIStore.isAddDialogOpen = true;
};

// 處理指定難度之快速新增
const handleAddRecordWithDiff = (payload: { song: Song; diff: string }) => {
    UIStore.prefilledSong = payload.song;
    UIStore.prefilledDifficulty = payload.diff as any;
    UIStore.isAddDialogOpen = true;
};
</script>

<style scoped lang="scss">
.song-explorer-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    color: var(--text-color);
}

/* 載入中 */
.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    color: var(--text-muted);

    .loading-spinner {
        font-size: 2rem;
        color: #3b82f6;
        margin-bottom: 1rem;
    }
}

/* 曲包資料夾 */
.packs-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

/* 查無結果 */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 1rem;
    color: var(--text-muted);

    .empty-icon {
        font-size: 2rem;
        margin-bottom: 0.75rem;
    }
}
</style>
