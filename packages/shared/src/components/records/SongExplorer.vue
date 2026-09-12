<template>
    <div class="song-explorer-container">
        <!-- 頂部提示與搜尋/模式切換/難度篩選 -->
        <ExplorerHeader
            v-model="packSearchQuery"
            :groupMode="groupMode"
            :selectedDifficulty="selectedDifficulty"
            @update:groupMode="setGroupMode"
            @update:selectedDifficulty="setSelectedDifficulty"
        />

        <!-- 載入中狀態 -->
        <div v-if="isLoading" class="loading-state">
            <i class="pi pi-spin pi-spinner loading-spinner"></i>
            <p>正在載入曲目資料庫...</p>
        </div>

        <!-- 分類資料夾列表 -->
        <div v-else class="packs-list">
            <PackFolder
                v-for="folder in filteredFolders"
                :key="folder.key"
                :packName="folder.title"
                :songs="folder.songs"
                :activePack="activePack"
                :activeSubVersion="activeSubVersion"
                :activeSongId="activeSongId"
                :packVersion="folder.badge || null"
                :icon="folder.icon"
                :subVersionsGroup="folder.subVersionsGroup"
                :sortedSubVersions="folder.sortedSubVersions"
                :memoryArchiveGroupedByVersion="folder.memoryArchiveGroupedByVersion"
                :sortedMemoryArchiveVersions="folder.sortedMemoryArchiveVersions"
                @toggle-pack="togglePack"
                @toggle-subversion="toggleSubVersion"
                @toggle-details="toggleSongDetails"
                @add-record="handleAddRecord"
                @add-record-diff="handleAddRecordWithDiff"
            />

            <!-- 查無結果 -->
            <div v-if="filteredFolders.length === 0" class="empty-state">
                <i class="pi pi-search-minus empty-icon"></i>
                <p>找不到符合的曲目或分類</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { debounce } from 'lodash';
import { fetchAllSongs, Song } from '@tracker/shared/utils/songDatabase';
import { useUIStore } from '@tracker/shared/stores/uiStore';
import { useRecordsStore } from '@tracker/shared/stores/recordsStore';
import ExplorerHeader, { GroupMode } from './explorer/ExplorerHeader.vue';
import PackFolder from './explorer/PackFolder.vue';

const UIStore = useUIStore();
const recordsStore = useRecordsStore();

const allSongs = ref<Song[]>([]);
const isLoading = ref(true);
const packSearchQuery = ref('');
const debouncedSearchQuery = ref('');

// 分類模式狀態（從 localStorage 載入預設）
const savedGroupMode = localStorage.getItem('arcaea_explorer_group_mode') as GroupMode | null;
const groupMode = ref<GroupMode>(savedGroupMode || 'pack');

// 難度篩選狀態（從 localStorage 載入預設）
const savedDiffFilter = localStorage.getItem('arcaea_explorer_diff_filter') || 'ALL';
const selectedDifficulty = ref<string>(savedDiffFilter);

const setGroupMode = (mode: GroupMode) => {
    groupMode.value = mode;
    localStorage.setItem('arcaea_explorer_group_mode', mode);
    // 切換分類維度時，重置展開狀態
    activePack.value = null;
    activeSongId.value = null;
    activeSubVersion.value = null;
};

const setSelectedDifficulty = (diff: string) => {
    selectedDifficulty.value = diff;
    localStorage.setItem('arcaea_explorer_diff_filter', diff);
    // 切換難度篩選時，重置展開狀態
    activePack.value = null;
    activeSongId.value = null;
    activeSubVersion.value = null;
};

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

// 版本號解析與比較
const parseVersion = (vStr: string): number[] => {
    if (!vStr) return [0, 0, 0];
    return vStr.split('.').map(num => parseInt(num, 10) || 0);
};

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

// 取得單曲最高定數
const getMaxConstant = (song: Song): number => {
    if (!song.constants) return 0;
    const values = Object.values(song.constants).filter((c): c is number => typeof c === 'number');
    return values.length > 0 ? Math.max(...values) : 0;
};

// 取得玩家在該歌曲（當前難度）的最高分數
const getSongMaxScore = (song: Song): number => {
    const diff = selectedDifficulty.value;
    const matched = recordsStore.records.filter(r => {
        if (r.title !== song.title) return false;
        if (diff !== 'ALL') {
            if (diff === 'BYD') {
                if (r.difficulty !== 'BYD' && r.difficulty !== 'BYD1' && r.difficulty !== 'BYD2') return false;
            } else if (r.difficulty !== diff) {
                return false;
            }
        }
        return true;
    });
    if (matched.length === 0) return -1;
    return Math.max(...matched.map(r => r.score <= 1005 ? r.score * 10000 : r.score));
};

// 判斷曲目是否符合搜尋條件
const matchSong = (song: Song, query: string): boolean => {
    if (!query) return true;
    
    // 曲名匹配
    if (song.title.toLowerCase().includes(query)) return true;
    // 作曲家匹配
    if (song.composer && song.composer.toLowerCase().includes(query)) return true;
    // 別名匹配
    if (song.aliases && song.aliases.some(alias => alias.toLowerCase().includes(query))) return true;
    // 版本匹配 (加入版本與追加版本)
    if (song.version_added && song.version_added.toLowerCase().includes(query)) return true;
    if (song.diff_updates) {
        for (const [diff, diffVer] of Object.entries(song.diff_updates)) {
            if (diff.toLowerCase().includes(query) || (diffVer && diffVer.toLowerCase().includes(query))) return true;
        }
    }
    // 曲包匹配
    if (song.pack && song.pack.toLowerCase().includes(query)) return true;
    // 難度等級或定數匹配
    if (song.constants) {
        for (const [diff, constVal] of Object.entries(song.constants)) {
            if (diff.toLowerCase().includes(query) || String(constVal).includes(query)) return true;
        }
    }

    return false;
};

interface FolderDefinition {
    key: string;
    title: string;
    badge?: string | null;
    icon?: string;
    songs: Song[];
    order: number;
    subVersionsGroup?: Record<string, Song[]>;
    sortedSubVersions?: string[];
    memoryArchiveGroupedByVersion?: Record<string, Song[]>;
    sortedMemoryArchiveVersions?: string[];
}

// 根據當前分組模式產生資料夾清單
const generatedFolders = computed<FolderDefinition[]>(() => {
    const mode = groupMode.value;
    const diff = selectedDifficulty.value;

    // 僅在「成績狀態」分類下根據選定難度過濾基礎曲目
    const songs = (mode === 'status' && diff !== 'ALL')
        ? allSongs.value.filter(s => {
            if (!s.constants) return false;
            if (diff === 'BYD') {
                return (s.constants as any)['BYD'] !== undefined ||
                       (s.constants as any)['BYD1'] !== undefined ||
                       (s.constants as any)['BYD2'] !== undefined;
            }
            return (s.constants as any)[diff] !== undefined;
        })
        : allSongs.value;

    // 1. 按曲包分組 (By Pack)
    if (mode === 'pack') {
        const packMap: Record<string, Song[]> = {};
        songs.forEach(song => {
            const pack = song.pack || 'Others';
            if (!packMap[pack]) packMap[pack] = [];
            packMap[pack].push(song);
        });

        // 計算最新版本
        const packVersions: Record<string, string> = {};
        for (const [packName, pSongs] of Object.entries(packMap)) {
            let maxVer = '0.0.0';
            pSongs.forEach(song => {
                const ver = song.version_added || '0.0.0';
                if (compareVersions(ver, maxVer) > 0) maxVer = ver;
                if (song.diff_updates) {
                    Object.values(song.diff_updates).forEach(diffVer => {
                        if (diffVer && compareVersions(diffVer, maxVer) > 0) maxVer = diffVer;
                    });
                }
            });
            packVersions[packName] = maxVer;
        }

        // 排序曲包 (最新版本在前)
        const sortedPacks = Object.keys(packMap).sort((a, b) => {
            const cmp = compareVersions(packVersions[b] || '0.0.0', packVersions[a] || '0.0.0');
            if (cmp !== 0) return cmp;
            return a.localeCompare(b);
        });

        return sortedPacks.map((packName, index) => {
            const pSongs = packMap[packName];
            const def: FolderDefinition = {
                key: packName,
                title: packName,
                badge: packVersions[packName],
                icon: 'pi pi-folder',
                songs: pSongs,
                order: index
            };

            // Memory Archive 內部的版本子分組
            if (packName === 'Memory Archive') {
                const verGroup: Record<string, Song[]> = {};
                pSongs.forEach(song => {
                    const ver = song.version_added || 'Others';
                    if (!verGroup[ver]) verGroup[ver] = [];
                    verGroup[ver].push(song);
                });
                def.memoryArchiveGroupedByVersion = verGroup;
                def.sortedMemoryArchiveVersions = Object.keys(verGroup).sort((a, b) => compareVersions(b, a));
            }

            return def;
        });
    }

    // 2. 按加入版本分組 (大版本 v6.x -> 小版本 v6.14.0 兩層分組)
    if (mode === 'version') {
        const majorMap: Record<string, Song[]> = {};
        songs.forEach(song => {
            let major = 'Others';
            if (song.version_added) {
                const parts = song.version_added.split('.');
                major = parts[0] ? `v${parts[0]}.x` : 'Others';
            }
            if (!majorMap[major]) majorMap[major] = [];
            majorMap[major].push(song);
        });

        // 排序大版本 (v6.x, v5.x, v4.x, ...)
        const sortedMajors = Object.keys(majorMap).sort((a, b) => {
            if (a === 'Others') return 1;
            if (b === 'Others') return -1;
            const numA = parseInt(a.replace(/[^\d]/g, ''), 10) || 0;
            const numB = parseInt(b.replace(/[^\d]/g, ''), 10) || 0;
            return numB - numA;
        });

        return sortedMajors.map((majorKey, index) => {
            const mSongs = majorMap[majorKey];

            // 大版本內按具體小版本分組
            const subVerGroup: Record<string, Song[]> = {};
            mSongs.forEach(song => {
                const subVer = song.version_added || 'Others';
                if (!subVerGroup[subVer]) subVerGroup[subVer] = [];
                subVerGroup[subVer].push(song);
            });

            const sortedSubVers = Object.keys(subVerGroup).sort((a, b) => compareVersions(b, a));

            return {
                key: majorKey,
                title: `版本 ${majorKey}`,
                badge: `${mSongs.length} 首`,
                icon: 'pi pi-calendar',
                songs: mSongs,
                order: index,
                subVersionsGroup: subVerGroup,
                sortedSubVersions: sortedSubVers
            };
        });
    }

    // 3. 按難度等級分組 (By Level)
    if (mode === 'level') {
        const levelBuckets = [
            { label: 'Level 12 / 11+', minConst: 11.6, icon: 'pi pi-bolt text-red-500' },
            { label: 'Level 11', minConst: 11.0, icon: 'pi pi-chart-bar' },
            { label: 'Level 10+', minConst: 10.7, icon: 'pi pi-chart-bar' },
            { label: 'Level 10', minConst: 10.0, icon: 'pi pi-chart-bar' },
            { label: 'Level 9+', minConst: 9.7, icon: 'pi pi-chart-bar' },
            { label: 'Level 9', minConst: 9.0, icon: 'pi pi-chart-bar' },
            { label: 'Level 8 及以下', minConst: 0, icon: 'pi pi-chart-bar' }
        ];

        const bucketSongs: Record<string, Song[]> = {};
        levelBuckets.forEach(b => { bucketSongs[b.label] = []; });

        songs.forEach(song => {
            const maxC = getMaxConstant(song);
            for (const b of levelBuckets) {
                if (maxC >= b.minConst) {
                    bucketSongs[b.label].push(song);
                    break;
                }
            }
        });

        return levelBuckets.map((b, index) => {
            const bSongs = (bucketSongs[b.label] || []).sort((x, y) => getMaxConstant(y) - getMaxConstant(x));
            return {
                key: b.label,
                title: b.label,
                badge: `${bSongs.length} 首`,
                icon: 'pi pi-chart-bar',
                songs: bSongs,
                order: index
            };
        });
    }

    // 4. 按個人成績狀態分組 (By Score Status)
    if (mode === 'status') {
        const statusBuckets = [
            { key: 'pm', label: '🌟 Pure Memory (10,000,000+)', minScore: 10000000 },
            { key: 'ex_plus', label: '🔴 EX+ (9,900,000+)', minScore: 9900000 },
            { key: 'ex', label: '🟡 EX (9,800,000+)', minScore: 9800000 },
            { key: 'aa', label: '🟢 AA (9,500,000+)', minScore: 9500000 },
            { key: 'clear', label: '⚪ Clear / A 及以下', minScore: 1 },
            { key: 'unplayed', label: '📭 尚未遊玩 (Unplayed)', minScore: 0 }
        ];

        const bucketSongs: Record<string, Song[]> = {};
        statusBuckets.forEach(b => { bucketSongs[b.key] = []; });

        songs.forEach(song => {
            const score = getSongMaxScore(song);
            if (score >= 10000000) bucketSongs['pm'].push(song);
            else if (score >= 9900000) bucketSongs['ex_plus'].push(song);
            else if (score >= 9800000) bucketSongs['ex'].push(song);
            else if (score >= 9500000) bucketSongs['aa'].push(song);
            else if (score > 0) bucketSongs['clear'].push(song);
            else bucketSongs['unplayed'].push(song);
        });

        return statusBuckets.map((b, index) => {
            const bSongs = bucketSongs[b.key] || [];
            return {
                key: b.key,
                title: b.label,
                badge: `${bSongs.length} 首`,
                icon: 'pi pi-star',
                songs: bSongs,
                order: index
            };
        });
    }

    return [];
});

// 搜尋過濾後的資料夾清單
const filteredFolders = computed(() => {
    const query = debouncedSearchQuery.value.trim().toLowerCase();
    const folders = generatedFolders.value;

    if (!query) return folders;

    const result: FolderDefinition[] = [];
    folders.forEach(folder => {
        // 如果資料夾名稱本身匹配搜尋詞，保留全部曲目
        if (folder.title.toLowerCase().includes(query)) {
            result.push(folder);
            return;
        }

        // 否則過濾出該資料夾內符合條件的歌曲
        const matchedSongs = folder.songs.filter(song => matchSong(song, query));
        if (matchedSongs.length > 0) {
            const newFolder = { ...folder, songs: matchedSongs };
            // 若為含有子版本的資料夾，同時過濾子版本內的歌曲
            if (folder.subVersionsGroup || folder.key === 'Memory Archive') {
                const subGroups: Record<string, Song[]> = {};
                matchedSongs.forEach(song => {
                    const ver = song.version_added || 'Others';
                    if (!subGroups[ver]) subGroups[ver] = [];
                    subGroups[ver].push(song);
                });
                const sortedSubs = Object.keys(subGroups).sort((a, b) => compareVersions(b, a));
                newFolder.subVersionsGroup = subGroups;
                newFolder.sortedSubVersions = sortedSubs;
                newFolder.memoryArchiveGroupedByVersion = subGroups;
                newFolder.sortedMemoryArchiveVersions = sortedSubs;
            }
            result.push(newFolder);
        }
    });

    return result;
});

// 開關資料夾折疊 (自動收縮其他)
const togglePack = (packName: string) => {
    if (activePack.value === packName) {
        activePack.value = null;
    } else {
        activePack.value = packName;
        // 切換資料夾時，自動摺疊曲目詳細與子版本資料夾
        activeSongId.value = null;
        activeSubVersion.value = null;
    }
};

// 開關 Memory Archive 子版本資料夾
const toggleSubVersion = (version: string) => {
    if (activeSubVersion.value === version) {
        activeSubVersion.value = null;
    } else {
        activeSubVersion.value = version;
        activeSongId.value = null;
    }
};

// 開關曲目詳細折疊
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
