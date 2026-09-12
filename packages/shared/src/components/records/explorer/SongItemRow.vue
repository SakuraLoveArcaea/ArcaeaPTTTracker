<template>
    <div class="song-item-wrapper">
        <!-- 曲目基本資料列 -->
        <div
            class="song-item-row"
            :class="{ 'expanded-details': activeSongId === song.objectID }"
            @mousedown="start"
            @mouseup="cancel"
            @mouseleave="cancel"
            @touchstart="start"
            @touchend="cancel"
            @touchmove="move"
            @click="handleRowClick"
        >
            <div class="song-info-left">
                <div class="song-title">{{ song.title }}</div>
                <div v-if="song.aliases && song.aliases.length" class="song-aliases">
                    {{ song.aliases.join(', ') }}
                </div>
                <div class="song-composer">{{ song.composer }}</div>
                <div class="song-diff-tags">
                    <div
                        v-for="(constant, diff) in filteredConstants"
                        :key="diff"
                        class="diff-badge-container"
                    >
                        <span 
                            v-if="UIStore.showScoresAboveBadges && getDifficultyScore(String(diff)) !== null" 
                            class="diff-score-text font-monospace"
                        >
                            {{ formatScoreShort(getDifficultyScore(String(diff))) }}
                        </span>
                        <DifficultyBadge
                            :difficulty="String(diff)"
                            :constant="constant"
                            :clickable="true"
                            @click.stop="onDiffClick(String(diff), $event)"
                        />
                    </div>
                </div>
            </div>
        </div>

        <!-- 曲目詳細資訊 (長按展開) -->
        <SongDetailsPanel
            :song="song"
            :show="activeSongId === song.objectID"
        />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Song } from '@tracker/shared/utils/songDatabase';
import { useLongPress } from '@tracker/shared/utils/useLongPress';
import { useRecordsStore } from '@tracker/shared/stores/recordsStore';
import { useUIStore } from '@tracker/shared/stores/uiStore';
import DifficultyBadge from './DifficultyBadge.vue';
import SongDetailsPanel from './SongDetailsPanel.vue';

const props = defineProps<{
    song: Song;
    activeSongId: string | null;
}>();

const emit = defineEmits(['add-record', 'add-record-diff', 'toggle-details']);

const recordsStore = useRecordsStore();
const UIStore = useUIStore();

// 處理長按觸發事件
const onLongPress = () => {
    emit('toggle-details', props.song.objectID);
};

// 引入全域的 useLongPress 鉤子
const { start, move, cancel, isLongPressActive } = useLongPress(onLongPress, 600);

const onDiffClick = (diff: string, event: Event) => {
    emit('add-record-diff', { song: props.song, diff });
};

const onAddClick = (event: Event) => {
    emit('add-record', props.song);
};

const handleRowClick = (e: Event) => {
    if (isLongPressActive.value) {
        e.preventDefault();
        e.stopPropagation();
        return;
    }
    emit('toggle-details', props.song.objectID);
};

// 過濾 PST, PRS 難度
const filteredConstants = computed(() => {
    if (UIStore.showPstPrs) {
        return props.song.constants;
    }
    const filtered: Record<string, number> = {};
    for (const [diff, constant] of Object.entries(props.song.constants)) {
        const d = diff.toUpperCase();
        if (d !== 'PST' && d !== 'PRS') {
            filtered[diff] = constant;
        }
    }
    return filtered;
});

// 取得該難度分數
const getDifficultyScore = (diff: string) => {
    const record = recordsStore.records.find(
        r => r.title === props.song.title && r.difficulty.toUpperCase() === diff.toUpperCase()
    );
    return record ? record.score : null;
};

// 格式化分數為短字串
const formatScoreShort = (score: number | null) => {
    if (score === null) return '';
    const rawScore = score <= 1005 ? Math.round(score * 10000) : Math.round(score);
    return rawScore.toLocaleString();
};
</script>

<style scoped lang="scss">
.song-item-wrapper {
    border-bottom: 1px solid rgba(255, 255, 255, 0.02);
    
    &:last-child {
        border-bottom: none;
    }
}

/* 曲目基本列 */
.song-item-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.65rem 1rem;
    cursor: pointer;
    user-select: none;
    transition: background-color 0.2s;

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

    .song-aliases {
        font-size: 0.7rem;
        color: var(--text-muted);
        opacity: 0.8;
        font-style: italic;
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
        gap: 0.25rem 0.35rem;
        margin-top: 0.25rem;
        align-items: flex-end; /* 使沒有分數的按鈕與有分數的按鈕底部對齊 */
    }
}

/* 難度與分數包裝器 */
.diff-badge-container {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 1px; /* 微小間距 */
}

/* 分數文字樣式 */
.diff-score-text {
    font-size: 0.5rem; /* 非常小，約 7.5px-8px，不超過按鈕寬度 */
    font-weight: 600;
    color: var(--text-muted);
    line-height: 1;
    letter-spacing: -0.5px; /* 緊湊排版 */
    user-select: none;
    pointer-events: none;
    text-align: center;
    white-space: nowrap;

    @media (min-width: 769px) {
        font-size: 0.58rem;
        letter-spacing: -0.3px;
    }
}

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

/* 日間模式適應樣式 */
:root:not(.p-dark) {
    .quick-add-btn {
        background: rgba(16, 185, 129, 0.08);
    }
}
</style>
