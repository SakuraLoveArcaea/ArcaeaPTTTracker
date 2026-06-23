<template>
    <Card
        :id="'record-card-' + record.id"
        class="record-card glass-panel"
        :class="{ 
            'expanded': isExpanded,
            'highlight-flash': UIStore.highlightedRecordId === record.id
        }"
        :style="getCardStyle(record.lastUpdate)"
    >
        <template #content>
            <!-- 卡片主要區域 -->
            <div 
                class="card-main-layout"
                @touchstart="onTouchStart($event)"
                @touchmove="onTouchMove($event)"
                @touchend="onTouchEnd($event)"
                @mousedown="onMouseDown($event)"
                @mouseup="onMouseUp($event)"
                @mouseleave="onMouseLeave"
            >
                <!-- 左上角小排行數字 -->
                <span class="card-rank-badge">
                    #{{ index < 30 ? index + 1 : '-' }}
                </span>

                <!-- 已連結符號 (右下角) -->
                <i v-if="record.autoUpdate" class="pi pi-link db-badge" title="資料庫自動更新"></i>

                <!-- 曲目與分數資訊 -->
                <div class="card-header-content" @click="handleHeaderClick($event)">
                    <div class="header-left">
                        <div class="title-section">
                            <span class="song-title">
                                {{ record.title }}
                            </span>
                            <span class="diff-badge" :style="{ backgroundColor: diffColors[record.difficulty] }">
                                {{ record.difficulty }}
                            </span>
                        </div>
                    </div>
                    <div class="header-right">
                        <div class="ptt-score-group">
                            <span class="play-ptt">{{ record.playPtt.toFixed(4) }}</span>
                            <span class="score-text">{{ formatScore(record.score) }}</span>
                        </div>
                        <i class="pi chevron-icon" :class="isExpanded ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
                    </div>
                </div>
            </div>

            <!-- 展開詳細資訊與操作按鈕 -->
            <transition name="slide-fade">
                <div v-if="isExpanded" class="card-details">
                    <div class="detail-divider"></div>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">單曲定數 (Constant)</span>
                            <span class="detail-value font-monospace">{{ record.constant.toFixed(1) }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">遊玩分數 (Score)</span>
                            <span class="detail-value font-monospace">{{ formatScore(record.score) }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">上次更新時間</span>
                            <span class="detail-value date-value-mobile">
                                {{ record.lastUpdate ? new Date(record.lastUpdate).toLocaleString('zh-TW', { hour12: false }) : '-' }}
                            </span>
                        </div>
                        <div v-if="UIStore.useExperimentalPttEstimation" class="detail-item chart-detail-item-mobile full-width">
                            <span class="detail-label">分數 PTT 估算</span>
                            <MobileInlineChart :record="record" :mini="true" />
                        </div>
                    </div>

                    <!-- 編輯動作列 -->
                    <div v-if="editable" class="card-actions">
                        <template v-if="UIStore.useExperimentalScoreInput">
                            <Button
                                v-if="!record.autoUpdate"
                                label="修改資訊"
                                icon="pi pi-info-circle"
                                outlined
                                severity="secondary"
                                size="small"
                                class="action-btn"
                                @click="onEditClick"
                            />
                            <Button
                                label="更新分數"
                                icon="pi pi-percentage"
                                outlined
                                severity="primary"
                                size="small"
                                class="action-btn"
                                @click="onScoreUpdateClick"
                            />
                        </template>
                        <template v-else>
                            <Button
                                label="編輯成績"
                                icon="pi pi-pencil"
                                outlined
                                severity="secondary"
                                size="small"
                                class="action-btn"
                                @click="onEditClick"
                            />
                        </template>
                    </div>
                </div>
            </transition>
        </template>
    </Card>
</template>

<script setup lang="ts">
import { ref, PropType } from 'vue';
import { Record, Difficulty } from '@tracker/shared/utils/record';
import Card from 'primevue/card';
import Button from 'primevue/button';
import { useUIStore } from '@tracker/shared/stores/uiStore';
import MobileInlineChart from './MobileInlineChart.vue';

const props = defineProps({
    record: {
        type: Object as PropType<Record>,
        required: true
    },
    index: {
        type: Number,
        required: true
    },
    isExpanded: {
        type: Boolean,
        default: false
    },
    editable: {
        type: Boolean,
        default: false
    },
    showFading: {
        type: Boolean,
        default: true
    },
    setting: {
        type: Object as PropType<{ baseHue: number; maxLevels: number; logBase: number; unitMinutes?: number }>,
        default: () => ({ baseHue: 142, maxLevels: 7, logBase: 2, unitMinutes: 15 })
    }
});

const emit = defineEmits<{
    (e: 'toggle-expand'): void;
    (e: 'long-press', payload: { el: HTMLElement, record: Record }): void;
}>();

const UIStore = useUIStore();

const diffColors: Record<Difficulty, string> = {
    'PST': '#5aa1d9',
    'PRS': '#81b144',
    'FTR': '#a155ab',
    'BYD': '#d63d41',
    'ETR': '#c4a1d1'
};

const formatScore = (score: number | null) => {
    if (score == null) return '-';
    return score.toFixed(4);
};

const onEditClick = () => {
    UIStore.editingRecord = props.record;
    UIStore.isAddDialogOpen = true;
};

const onScoreUpdateClick = () => {
    UIStore.scoreInputRecord = props.record;
    UIStore.isScoreInputDialogOpen = true;
};

// 長按與觸控邏輯
const touchTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const isLongPressActive = ref(false);
const startTouchX = ref(0);
const startTouchY = ref(0);

const startLongPressTimer = (targetEl: HTMLElement) => {
    isLongPressActive.value = false;
    if (touchTimer.value) clearTimeout(touchTimer.value);
    
    touchTimer.value = setTimeout(() => {
        isLongPressActive.value = true;
        emit('long-press', { el: targetEl, record: props.record });
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }, 600);
};

const cancelLongPressTimer = () => {
    if (touchTimer.value) {
        clearTimeout(touchTimer.value);
        touchTimer.value = null;
    }
};

const onTouchStart = (event: TouchEvent) => {
    const touch = event.touches[0];
    startTouchX.value = touch.clientX;
    startTouchY.value = touch.clientY;
    startLongPressTimer(event.currentTarget as HTMLElement);
};

const onTouchMove = (event: TouchEvent) => {
    if (!touchTimer.value) return;
    const touch = event.touches[0];
    const diffX = Math.abs(touch.clientX - startTouchX.value);
    const diffY = Math.abs(touch.clientY - startTouchY.value);
    if (diffX > 10 || diffY > 10) {
        cancelLongPressTimer();
    }
};

const onTouchEnd = (event: TouchEvent) => {
    cancelLongPressTimer();
    if (isLongPressActive.value) {
        event.preventDefault();
        event.stopPropagation();
        setTimeout(() => { isLongPressActive.value = false; }, 50);
    }
};

const onMouseDown = (event: MouseEvent) => {
    if (event.button !== 0) return;
    startLongPressTimer(event.currentTarget as HTMLElement);
};

const onMouseUp = (event: MouseEvent) => {
    cancelLongPressTimer();
};

const onMouseLeave = () => {
    cancelLongPressTimer();
};

const handleHeaderClick = (event: Event) => {
    if (isLongPressActive.value) {
        isLongPressActive.value = false;
        return;
    }
    emit('toggle-expand');
};

const getCardStyle = (lastUpdate: number) => {
    if (!props.showFading || !lastUpdate) {
        return {};
    }

    const now = Date.now();
    const diffMinutes = (now - lastUpdate) / (1000 * 60);

    const logBase = props.setting.logBase || 2;
    const maxLevels = props.setting.maxLevels || 7;
    const unitMinutes = props.setting.unitMinutes || 15;

    let level = 0;
    for (let i = 0; i < maxLevels - 1; i++) {
        const threshold = unitMinutes * Math.pow(logBase, i);
        if (diffMinutes <= threshold) {
            level = i;
            break;
        }
        if (i === maxLevels - 2) {
            level = maxLevels - 1;
        }
    }

    const baseHue = props.setting.baseHue || 142;

    const minLightness = 45;
    const maxLightness = 90;
    const maxSaturation = 85;
    const minSaturation = 40;

    const currentLightness = minLightness + ((maxLightness - minLightness) / (maxLevels - 1)) * level;
    const currentSaturation = maxSaturation - ((maxSaturation - minSaturation) / (maxLevels - 1)) * level;

    return {
        '--card-fading-color': `hsl(${baseHue}, ${currentSaturation}%, ${currentLightness}%)`
    };
};
</script>

<style scoped lang="scss">
.record-card {
    background: var(--bg-card) !important;
    border: 1px solid var(--border-color) !important;
    border-left: 4px solid var(--card-fading-color, var(--border-color)) !important;
    border-radius: 12px !important;
    padding: 0;
    overflow: hidden;
    transition: border-color 0.25s, background-color 0.25s, box-shadow 0.25s;
    box-shadow: none !important;

    :deep(.p-card-body), :deep(.p-card-content) {
        padding: 0 !important;
    }

    &.highlight-flash {
        animation: flash-border 2s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
    }
}

@keyframes flash-border {
    0% {
        border-color: #3b82f6 !important;
        box-shadow: 0 0 16px rgba(59, 130, 246, 0.7) !important;
        background-color: rgba(59, 130, 246, 0.15) !important;
    }
    100% {
        // 還原
    }
}

.card-main-layout {
    display: flex;
    width: 100%;
    min-height: 50px;
    align-items: stretch;
    position: relative;
    user-select: none;
}

.card-rank-badge {
    position: absolute;
    top: 0;
    left: 0;
    font-size: 0.6rem;
    font-weight: 800;
    font-family: 'Courier New', Courier, monospace;
    padding: 0.1rem 0.25rem;
    border-top-left-radius: 12px;
    border-bottom-right-radius: 8px;
    background: rgba(255, 255, 255, 0.05);
    border-right: 1px solid var(--border-color);
    border-bottom: 1px solid var(--border-color);
    color: var(--text-muted);
    z-index: 2;
    line-height: 1;
}

.db-badge {
    position: absolute;
    bottom: 8px;
    right: 8px;
    font-size: 0.65rem;
    color: #3b82f6;
    z-index: 2;
}

.card-header-content {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.65rem 1rem 0.65rem 1.5rem;
    min-width: 0;
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    min-width: 0;
}

.title-section {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
}

.song-title {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: flex;
    align-items: center;
    gap: 0.35rem;
}

.diff-badge {
    font-size: 0.7rem;
    font-weight: 800;
    color: white;
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
    align-self: flex-start;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.header-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.ptt-score-group {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.15rem;
}

.play-ptt {
    font-family: 'Courier New', Courier, monospace;
    font-weight: 700;
    font-size: 0.95rem;
    color: #3b82f6;
    line-height: 1.1;
}

.score-text {
    font-family: 'Courier New', Courier, monospace;
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 600;
    line-height: 1.1;
}

.chevron-icon {
    font-size: 0.8rem;
    color: var(--text-muted);
}

// 展開詳情區域
.card-details {
    padding: 0 1rem 1rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
}

.detail-divider {
    height: 1px;
    background: var(--border-color);
    width: 100%;
}

.detail-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
}

.detail-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    &.full-width {
        grid-column: span 2;
    }
}

.chart-detail-item-mobile {
  :deep(.inline-ptt-chart-container) {
    padding: 0 !important;
    background: transparent !important;
    border: none !important;
    margin-top: 0 !important;
    gap: 0.35rem !important;
    max-width: 360px !important;
    margin: 0 auto !important;

    .chart-container-inline {
      height: 100px !important;
    }
  }
}

.date-value-mobile {
  font-size: 0.72rem !important;
  word-break: break-all;
}

.detail-label {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 500;
}

.detail-value {
    font-size: 0.85rem;
    color: var(--text-color);
    font-weight: 600;

    &.font-monospace {
        font-family: 'Courier New', Courier, monospace;
    }
}

.card-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 0.25rem;
}

.action-btn {
    flex: 1;
    font-weight: 600 !important;
}

// 展開/收合動畫
.slide-fade-enter-active, .slide-fade-leave-active {
    transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.slide-fade-enter-from, .slide-fade-leave-to {
    opacity: 0;
    transform: translateY(-8px);
    max-height: 0;
    padding-bottom: 0 !important;
    overflow: hidden;
}
</style>
