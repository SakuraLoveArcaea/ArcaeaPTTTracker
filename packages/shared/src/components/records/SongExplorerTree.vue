<template>
    <div class="song-explorer-container">
        <!-- 頂部提示與搜尋 -->
        <div class="explorer-header">
            <div class="help-banner">
                <i class="pi pi-info-circle banner-icon"></i>
                <span class="banner-text">提示：點擊右側 「+」 快速新增，點擊難度標籤以該難度新增。長按曲目或點擊可展開詳細屬性。</span>
            </div>
            
            <div class="search-input-wrapper">
                <i class="pi pi-search search-icon"></i>
                <input
                    v-model="packSearchQuery"
                    type="text"
                    placeholder="搜尋曲包名稱 (例如: Memory)..."
                    class="search-bar"
                />
                <i v-if="packSearchQuery" class="pi pi-times clear-icon" @click="packSearchQuery = ''"></i>
            </div>
        </div>

        <!-- 載入中狀態 -->
        <div v-if="isLoading" class="loading-state">
            <i class="pi pi-spin pi-spinner loading-spinner"></i>
            <p>正在載入曲目資料庫...</p>
        </div>

        <!-- PrimeVue Tree 列表 -->
        <div v-else class="tree-wrapper">
            <Tree
                :value="treeValue"
                :expandedKeys="expandedKeys"
                @node-expand="onNodeExpand"
                @node-collapse="onNodeCollapse"
                class="custom-pv-tree"
            >
                <!-- 曲包節點樣式 -->
                <template #pack="slotProps">
                    <div class="tree-pack-node">
                        <i :class="expandedKeys[slotProps.node.key] ? 'pi pi-folder-open folder-icon active' : 'pi pi-folder folder-icon'"></i>
                        <span class="pack-name">{{ slotProps.node.label }}</span>
                        <span class="song-count">({{ slotProps.node.data.count }})</span>
                        <span class="pack-version-badge" v-if="slotProps.node.data.version">v{{ slotProps.node.data.version }}</span>
                    </div>
                </template>

                <!-- 版本子資料夾節點樣式 -->
                <template #version="slotProps">
                    <div class="tree-version-node">
                        <i :class="expandedKeys[slotProps.node.key] ? 'pi pi-folder-open subfolder-icon active' : 'pi pi-folder subfolder-icon'"></i>
                        <span class="subfolder-name">Version {{ slotProps.node.label }}</span>
                        <span class="subsong-count">({{ slotProps.node.data.count }})</span>
                    </div>
                </template>

                <!-- 歌曲節點樣式 -->
                <template #song="slotProps">
                    <div class="song-node-wrapper">
                        <!-- 曲目基本資料列 -->
                        <div
                            class="song-item-row"
                            :class="{ 'expanded-details': activeSongId === slotProps.node.data.song.objectID }"
                            @mousedown="handleMouseDown($event, slotProps.node.data.song)"
                            @mouseup="handleMouseUp"
                            @mouseleave="handleMouseUp"
                            @touchstart="handleTouchStart($event, slotProps.node.data.song)"
                            @touchend="handleTouchEnd"
                            @touchmove="handleTouchMove"
                            @click="handleRowClick($event, slotProps.node.data.song)"
                        >
                            <div class="song-info-left">
                                <div class="song-title">{{ slotProps.node.data.song.title }}</div>
                                <div class="song-composer">{{ slotProps.node.data.song.composer }}</div>
                                <div class="song-diff-tags">
                                    <span
                                        v-for="(constant, diff) in slotProps.node.data.song.constants"
                                        :key="diff"
                                        class="diff-badge clickable"
                                        :class="getDiffClass(diff)"
                                        @click.stop="addSongRecordWithDiff(slotProps.node.data.song, diff, $event)"
                                        @mousedown.stop
                                        @touchstart.stop
                                        title="點擊以該難度新增成績"
                                    >
                                        {{ diff }} {{ constant.toFixed(1) }}
                                    </span>
                                </div>
                            </div>
                            <div class="song-action-right">
                                <button
                                    class="quick-add-btn"
                                    @click.stop="addSongRecord(slotProps.node.data.song, $event)"
                                    @mousedown.stop
                                    @touchstart.stop
                                    title="快速新增成績"
                                >
                                    <i class="pi pi-plus"></i>
                                </button>
                            </div>
                        </div>

                        <!-- 曲目詳細資訊 (長按展開) -->
                        <transition name="slide-inner">
                            <div v-show="activeSongId === slotProps.node.data.song.objectID" class="song-details-panel">
                                <div class="details-grid">
                                    <div class="detail-cell">
                                        <span class="detail-label">BPM:</span>
                                        <span class="detail-val">{{ slotProps.node.data.song.bpm || 'N/A' }}</span>
                                    </div>
                                    <div class="detail-cell">
                                        <span class="detail-label">時長:</span>
                                        <span class="detail-val">{{ slotProps.node.data.song.duration || 'N/A' }}</span>
                                    </div>
                                    <div class="detail-cell">
                                        <span class="detail-label">版本:</span>
                                        <span class="detail-val">v{{ slotProps.node.data.song.version || 'N/A' }}</span>
                                    </div>
                                </div>
                                <div v-if="slotProps.node.data.song.aliases && slotProps.node.data.song.aliases.length" class="details-aliases">
                                    <span class="detail-label">別名:</span>
                                    <span class="detail-val font-italic">{{ slotProps.node.data.song.aliases.join(', ') }}</span>
                                </div>
                            </div>
                        </transition>
                    </div>
                </template>
            </Tree>

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
import Tree from 'primevue/tree';
import { fetchAllSongs, Song } from '@tracker/shared/utils/songDatabase';
import { useUIStore } from '@tracker/shared/stores/uiStore';

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

const activeSongId = ref<string | null>(null);
const expandedKeys = ref<Record<string, boolean>>({});

// 手勢計時器相關
const pressTimer = ref<any>(null);
const startX = ref(0);
const startY = ref(0);
const isLongPressTriggered = ref(false);

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

// Memory Archive 專用：按版本分組
const memoryArchiveGroupedByVersion = computed(() => {
    const songs = groupedSongs.value['Memory Archive'] || [];
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
    const packs = Object.keys(groupedSongs.value);
    
    const filtered = query 
        ? packs.filter(pack => pack.toLowerCase().includes(query))
        : packs;

    return filtered.sort((a, b) => {
        const verA = packLatestVersions.value[a] || '0.0.0';
        const verB = packLatestVersions.value[b] || '0.0.0';
        const cmp = compareVersions(verB, verA);
        if (cmp !== 0) return cmp;
        return a.localeCompare(b);
    });
});

// 建立 Tree 所需結構
const treeValue = computed(() => {
    return filteredPackNames.value.map(packName => {
        const packKey = `pack-${packName}`;
        const songs = groupedSongs.value[packName] || [];
        
        let children: any[] = [];
        if (packName === 'Memory Archive') {
            const versions = sortedMemoryArchiveVersions.value;
            children = versions.map(ver => {
                const versionSongs = memoryArchiveGroupedByVersion.value[ver] || [];
                return {
                    key: `version-${packName}-${ver}`,
                    label: ver,
                    type: 'version',
                    data: { count: versionSongs.length },
                    children: versionSongs.map(song => ({
                        key: `song-${song.objectID}`,
                        type: 'song',
                        data: { song }
                    }))
                };
            });
        } else {
            children = songs.map(song => ({
                key: `song-${song.objectID}`,
                type: 'song',
                data: { song }
            }));
        }
        
        return {
            key: packKey,
            label: packName,
            type: 'pack',
            data: {
                count: songs.length,
                version: packLatestVersions.value[packName]
            },
            children
        };
    });
});

// 處理 PrimeVue Tree 獨佔折疊 (展開新曲包時自動收合其他)
const onNodeExpand = (node: any) => {
    const key = node.key;
    const newExpandedKeys: Record<string, boolean> = {};

    if (key.startsWith('pack-')) {
        // 只保留當前展開的曲包
        newExpandedKeys[key] = true;
        activeSongId.value = null; // 收合曲目詳細
    } else if (key.startsWith('version-')) {
        // 保留父曲包展開，並且只保留當前展開的版本資料夾
        const parts = key.split('-'); // ["version", "Memory Archive", version]
        const parentPackKey = `pack-${parts[1]}`;
        newExpandedKeys[parentPackKey] = true;
        newExpandedKeys[key] = true;
        activeSongId.value = null; // 收合曲目詳細
    }

    expandedKeys.value = newExpandedKeys;
};

const onNodeCollapse = (node: any) => {
    const key = node.key;
    // 從展開鍵值對中移除
    if (expandedKeys.value[key]) {
        const temp = { ...expandedKeys.value };
        delete temp[key];
        expandedKeys.value = temp;
    }
};

// 取得難度 badge Class
const getDiffClass = (diff: string | number) => {
    const d = String(diff).toUpperCase();
    if (d.includes('PST')) return 'diff-pst';
    if (d.includes('PRS')) return 'diff-prs';
    if (d.includes('FTR')) return 'diff-ftr';
    if (d.includes('BYD')) return 'diff-byd';
    if (d.includes('ETR')) return 'diff-etr';
    return '';
};

// 處理快速新增
const addSongRecord = (song: Song, event: Event) => {
    UIStore.prefilledSong = song;
    UIStore.isAddDialogOpen = true;
};

// 處理指定難度之快速新增
const addSongRecordWithDiff = (song: Song, diff: string, event: Event) => {
    UIStore.prefilledSong = song;
    UIStore.prefilledDifficulty = diff as any;
    UIStore.isAddDialogOpen = true;
};

// 開關曲目詳細折疊 (自動收縮其他)
const toggleSongDetails = (songId: string) => {
    if (activeSongId.value === songId) {
        activeSongId.value = null;
    } else {
        activeSongId.value = songId;
    }
};

// 觸控手勢處理 (長按)
const handleTouchStart = (e: TouchEvent, song: Song) => {
    isLongPressTriggered.value = false;
    if (e.touches.length > 0) {
        startX.value = e.touches[0].clientX;
        startY.value = e.touches[0].clientY;
    }
    clearTimeout(pressTimer.value);
    pressTimer.value = setTimeout(() => {
        isLongPressTriggered.value = true;
        toggleSongDetails(song.objectID);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(50);
        }
    }, 600);
};

const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length > 0) {
        const diffX = Math.abs(e.touches[0].clientX - startX.value);
        const diffY = Math.abs(e.touches[0].clientY - startY.value);
        if (diffX > 10 || diffY > 10) {
            clearTimeout(pressTimer.value);
        }
    }
};

const handleTouchEnd = () => {
    clearTimeout(pressTimer.value);
};

// 滑鼠手勢處理 (長按/點擊)
const handleMouseDown = (e: MouseEvent, song: Song) => {
    if (e.button !== 0) return;
    isLongPressTriggered.value = false;
    clearTimeout(pressTimer.value);
    pressTimer.value = setTimeout(() => {
        isLongPressTriggered.value = true;
        toggleSongDetails(song.objectID);
    }, 600);
};

const handleMouseUp = () => {
    clearTimeout(pressTimer.value);
};

const handleRowClick = (e: Event, song: Song) => {
    if (isLongPressTriggered.value) {
        e.preventDefault();
        e.stopPropagation();
        return;
    }
    toggleSongDetails(song.objectID);
};
</script>

<style scoped lang="scss">
.song-explorer-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    color: var(--text-color);
}

/* 提示橫幅 */
.help-banner {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.65rem 0.85rem;
    background: rgba(59, 130, 246, 0.08);
    border-left: 3px solid #3b82f6;
    border-radius: 4px;
    margin-bottom: 0.75rem;

    .banner-icon {
        color: #3b82f6;
        font-size: 1rem;
        flex-shrink: 0;
    }

    .banner-text {
        font-size: 0.8rem;
        color: var(--text-muted);
        line-height: 1.4;
    }
}

/* 搜尋框 */
.search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    margin-bottom: 0.5rem;

    .search-icon {
        position: absolute;
        left: 0.75rem;
        color: var(--text-muted);
    }

    .clear-icon {
        position: absolute;
        right: 0.75rem;
        color: var(--text-muted);
        cursor: pointer;
        transition: color 0.2s;

        &:hover {
            color: var(--text-color);
        }
    }

    .search-bar {
        width: 100%;
        padding: 0.6rem 2.2rem;
        background: var(--input-bg, rgba(30, 41, 59, 0.4));
        border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
        border-radius: 6px;
        color: var(--text-color);
        font-size: 0.9rem;
        outline: none;
        transition: border-color 0.2s, box-shadow 0.2s;

        &:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }
    }
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

/* PrimeVue Tree 樣式深度覆蓋 */
.custom-pv-tree {
    background: transparent !important;
    border: none !important;
    padding: 0 !important;

    :deep(.p-tree-root-children) {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    :deep(.p-treenode) {
        background: rgba(255, 255, 255, 0.015) !important;
        border: 1px solid var(--border-color, rgba(255, 255, 255, 0.05)) !important;
        border-radius: 8px;
        overflow: hidden;
        padding: 0 !important;
        
        .p-treenode-content {
            padding: 0.85rem 1rem !important;
            border-radius: 0 !important;
            transition: background-color 0.2s;
            cursor: pointer;
            display: flex;
            align-items: center;
            outline: none;
            gap: 0.5rem;
            
            &:hover {
                background: rgba(255, 255, 255, 0.03) !important;
            }

            .p-treenode-toggle {
                margin: 0 !important;
                width: auto !important;
                height: auto !important;
                color: var(--text-muted) !important;
                
                &:hover {
                    background: transparent !important;
                }
            }

            /* 隱藏預設的節點 icon，我們用自定義的 */
            .p-treenode-icon {
                display: none !important;
            }
        }

        /* 子節點容器 (展開後的內容) */
        .p-treenode-children {
            padding: 0 !important;
            background: rgba(0, 0, 0, 0.15);
            border-top: 1px solid var(--border-color, rgba(255, 255, 255, 0.05));
            display: flex;
            flex-direction: column;
            
            .p-treenode {
                background: transparent !important;
                border: none !important;
                border-bottom: 1px solid rgba(255, 255, 255, 0.02) !important;
                border-radius: 0 !important;

                &:last-child {
                    border-bottom: none !important;
                }

                .p-treenode-content {
                    padding: 0 !important;
                    cursor: default;

                    &:hover {
                        background: transparent !important;
                    }
                    
                    /* 隱藏歌曲節點前方的 toggle 按鈕 */
                    .p-treenode-toggle {
                        display: none !important;
                    }
                }
            }
        }
    }
}

/* 曲包節點內容 */
.tree-pack-node {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    flex: 1;

    .folder-icon {
        color: var(--text-muted);
        font-size: 1.1rem;
        transition: color 0.2s;

        &.active {
            color: #3b82f6;
        }
    }

    .pack-name {
        font-weight: 600;
        font-size: 0.95rem;
    }

    .song-count {
        color: var(--text-muted);
        font-size: 0.8rem;
    }

    .pack-version-badge {
        font-size: 0.7rem;
        background: rgba(59, 130, 246, 0.12);
        color: #3b82f6;
        padding: 0.08rem 0.35rem;
        border-radius: 4px;
        font-weight: bold;
        border: 1px solid rgba(59, 130, 246, 0.25);
    }
}

/* 版本子資料夾節點內容 */
.tree-version-node {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    flex: 1;
    margin-left: 0.75rem;

    .subfolder-icon {
        color: var(--text-muted);
        font-size: 0.95rem;
        transition: color 0.2s;

        &.active {
            color: #10b981;
        }
    }

    .subfolder-name {
        font-weight: 500;
        font-size: 0.85rem;
    }

    .subsong-count {
        color: var(--text-muted);
        font-size: 0.75rem;
    }
}

/* 歌曲節點包裝 */
.song-node-wrapper {
    width: 100%;
    display: flex;
    flex-direction: column;
}

/* 曲目基本列 */
.song-item-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.65rem 1rem;
    width: 100%;
    cursor: pointer;
    user-select: none;
    transition: background-color 0.2s;
    box-sizing: border-box;

    &:hover {
        background: rgba(255, 255, 255, 0.03);
    }

    &.expanded-details {
        background: rgba(59, 130, 246, 0.04);
    }
}

.song-info-left {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
    flex: 1;

    .song-title {
        font-weight: bold;
        font-size: 0.88rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .song-composer {
        font-size: 0.72rem;
        color: var(--text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .song-diff-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
        margin-top: 0.15rem;
    }
}

/* 難度標籤 */
.diff-badge {
    padding: 0.12rem 0.3rem;
    border-radius: 3px;
    font-size: 0.62rem;
    font-weight: 700;
    color: #fff;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    user-select: none;

    &.clickable {
        cursor: pointer;
        transition: transform 0.15s, filter 0.15s;

        &:hover {
            transform: scale(1.08);
            filter: brightness(1.15);
        }

        &:active {
            transform: scale(0.95);
        }
    }
}

.diff-pst { background-color: #5aa1d9; }
.diff-prs { background-color: #81b144; }
.diff-ftr { background-color: #a155ab; }
.diff-byd { background-color: #d63d41; }
.diff-etr { background-color: #c4a1d1; }

/* 快速新增按鈕 */
.song-action-right {
    flex-shrink: 0;
    margin-left: 0.5rem;
}

.quick-add-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.3);
    color: #10b981;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);

    &:hover {
        background: #10b981;
        color: #fff;
        transform: scale(1.1);
        box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
    }

    &:active {
        transform: scale(0.95);
    }
}

/* 曲目詳細面板 (長按展開) */
.song-details-panel {
    background: rgba(0, 0, 0, 0.25);
    padding: 0.65rem 1rem;
    border-left: 3px solid #3b82f6;
    font-size: 0.78rem;
    color: var(--text-muted);
    width: 100%;
    box-sizing: border-box;
}

.details-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
    margin-bottom: 0.35rem;

    .detail-cell {
        display: flex;
        gap: 0.3rem;
    }
}

.details-aliases {
    display: flex;
    gap: 0.3rem;
    margin-top: 0.25rem;
    word-break: break-all;
}

.detail-label {
    font-weight: bold;
    color: var(--text-color);
}

.detail-val {
    color: var(--text-muted);
}

.font-italic {
    font-style: italic;
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

/* 動畫 transition */
.slide-inner-enter-active,
.slide-inner-leave-active {
    transition: max-height 0.2s ease-in-out, opacity 0.15s ease-out;
    max-height: 120px;
    overflow: hidden;
}

.slide-inner-enter-from,
.slide-inner-leave-to {
    max-height: 0;
    opacity: 0;
}

/* 日間模式適應樣式 */
:root:not(.p-dark) {
    .help-banner {
        background: rgba(59, 130, 246, 0.05);
    }
    
    .custom-pv-tree {
        :deep(.p-treenode) {
            background: rgba(0, 0, 0, 0.01) !important;
            border-color: rgba(0, 0, 0, 0.03) !important;
            
            .p-treenode-content:hover {
                background: rgba(0, 0, 0, 0.02) !important;
            }
            
            .p-treenode-children {
                background: rgba(0, 0, 0, 0.03);
                border-top-color: rgba(0, 0, 0, 0.03);
            }
        }
    }

    .song-details-panel {
        background: rgba(0, 0, 0, 0.05);
    }
    
    .quick-add-btn {
        background: rgba(16, 185, 129, 0.08);
    }
}
</style>
