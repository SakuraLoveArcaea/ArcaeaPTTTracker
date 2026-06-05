<template>
    <div class="records-mobile-list-container">
        <!-- 點擊排行管理的彈出選單 -->
        <Menu ref="rankMenu" :model="menuItems" :popup="true">
            <template #item="{ item }">
                <div class="menu-item-custom" :class="item.class" @click="item.command">
                    <i :class="item.icon" class="menu-item-icon"></i>
                    <span class="menu-item-label">{{ item.label }}</span>
                </div>
            </template>
        </Menu>

        <div v-if="isLoading" class="loading-state">
            <i class="pi pi-spin pi-spinner spinner-icon"></i>
            <span>載入中...</span>
        </div>

        <div v-else-if="records.length === 0" class="empty-state">
            Currently no records.<br/>
            <span v-if="editable">點擊懸浮加號或右上角「新增」手動加入。</span>
        </div>

        <div v-else class="cards-wrapper">
            <Card
                v-for="(record, index) in records"
                :key="record.id"
                :id="'record-card-' + record.id"
                class="record-card glass-panel"
                :class="{ 
                    'expanded': expandedRecordId === record.id,
                    'highlight-flash': UIStore.highlightedRecordId === record.id
                }"
                :style="getCardStyle(record.lastUpdate)"
            >
                <template #content>
                    <!-- 卡片主要區域 -->
                    <div 
                        class="card-main-layout"
                        @touchstart="onTouchStart($event, record)"
                        @touchmove="onTouchMove($event)"
                        @touchend="onTouchEnd($event)"
                        @mousedown="onMouseDown($event, record)"
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
                        <div class="card-header-content" @click="handleHeaderClick($event, record.id)">
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
                                <i class="pi chevron-icon" :class="expandedRecordId === record.id ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
                            </div>
                        </div>
                    </div>

                    <!-- 展開詳細資訊與操作按鈕 -->
                    <transition name="slide-fade">
                        <div v-if="expandedRecordId === record.id" class="card-details">
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
                                <div class="detail-item full-width">
                                    <span class="detail-label">上次更新時間</span>
                                    <span class="detail-value">
                                        {{ record.lastUpdate ? new Date(record.lastUpdate).toLocaleString('zh-TW', { hour12: false }) : '-' }}
                                    </span>
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
                                        @click="onEditClick(record)"
                                    />
                                    <Button
                                        label="更新分數"
                                        icon="pi pi-percentage"
                                        outlined
                                        severity="primary"
                                        size="small"
                                        class="action-btn"
                                        @click="onScoreUpdateClick(record)"
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
                                        @click="onEditClick(record)"
                                    />
                                </template>
                            </div>
                        </div>
                    </transition>
                </template>
            </Card>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, PropType, watch, computed } from 'vue';
import { Record, Difficulty } from '@/utils/record';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Menu from 'primevue/menu';
import { useUIStore } from '@/stores/uiStore';
import { useRecordsStore } from '@/stores/recordsStore';

const props = defineProps({
    records: {
        type: Array as PropType<Record[]>,
        default: () => []
    },
    isLoading: {
        type: Boolean,
        default: false
    },
    editable: {
        type: Boolean,
        default: false
    },
    deletable: {
        type: Boolean,
        default: false
    },
    showFading: {
        type: Boolean,
        default: true
    },
    setting: {
        type: Object as PropType<{ baseHue: number; maxLevels: number }>,
        default: () => ({ baseHue: 142, maxLevels: 7 })
    }
});

const emit = defineEmits<{
    (e: 'request-delete', record: Record): void;
}>();

const UIStore = useUIStore();
const expandedRecordId = ref<string | null>(null);

const diffColors: Record<Difficulty, string> = {
    'PST': '#5aa1d9',
    'PRS': '#81b144',
    'FTR': '#a155ab',
    'BYD': '#d63d41',
    'ETR': '#c4a1d1'
};

const toggleExpand = (id: string) => {
    if (expandedRecordId.value === id) {
        expandedRecordId.value = null;
    } else {
        expandedRecordId.value = id;
    }
};

// 監聽來自 Pinia 的展開命令（圖表跳轉定位時觸發）
watch(() => UIStore.expandedRecordId, (newVal) => {
    if (newVal) {
        expandedRecordId.value = newVal;
    }
});

const recordsStore = useRecordsStore();
const rankMenu = ref<any>(null);
const selectedRecord = ref<Record | null>(null);

// 長按與觸控邏輯
const touchTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const isLongPressActive = ref(false);
const startTouchX = ref(0);
const startTouchY = ref(0);
let activeTargetElement: HTMLElement | null = null;

const startLongPressTimer = (targetEl: HTMLElement, record: Record) => {
    isLongPressActive.value = false;
    activeTargetElement = targetEl;
    
    if (touchTimer.value) clearTimeout(touchTimer.value);
    
    touchTimer.value = setTimeout(() => {
        isLongPressActive.value = true;
        showMenuAtElement(activeTargetElement, record);
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

const onTouchStart = (event: TouchEvent, record: Record) => {
    // 只有在未展開狀態才支援長按
    if (expandedRecordId.value === record.id) return;
    
    const touch = event.touches[0];
    startTouchX.value = touch.clientX;
    startTouchY.value = touch.clientY;
    
    const targetEl = event.currentTarget as HTMLElement;
    startLongPressTimer(targetEl, record);
};

const onTouchMove = (event: TouchEvent) => {
    if (!touchTimer.value) return;
    const touch = event.touches[0];
    const diffX = Math.abs(touch.clientX - startTouchX.value);
    const diffY = Math.abs(touch.clientY - startTouchY.value);
    
    // 如果移動距離大於 10px，判定為滾動而非長按，取消計時器
    if (diffX > 10 || diffY > 10) {
        cancelLongPressTimer();
    }
};

const onTouchEnd = (event: TouchEvent) => {
    cancelLongPressTimer();
    if (isLongPressActive.value) {
        event.preventDefault();
        event.stopPropagation();
        // 延遲一點點重置，確保 click 事件也能被順利攔截
        setTimeout(() => {
            isLongPressActive.value = false;
        }, 50);
    }
};

const onMouseDown = (event: MouseEvent, record: Record) => {
    // 只有在未展開狀態才支援長按
    if (expandedRecordId.value === record.id) return;
    if (event.button !== 0) return; // 僅處理左鍵
    
    const targetEl = event.currentTarget as HTMLElement;
    startLongPressTimer(targetEl, record);
};

const onMouseUp = (event: MouseEvent) => {
    cancelLongPressTimer();
};

const onMouseLeave = () => {
    cancelLongPressTimer();
};

const handleHeaderClick = (event: Event, recordId: string) => {
    if (isLongPressActive.value) {
        isLongPressActive.value = false;
        return;
    }
    toggleExpand(recordId);
};

const showMenuAtElement = (el: HTMLElement | null, record: Record) => {
    if (!props.deletable) return;
    selectedRecord.value = record;
    if (rankMenu.value && el) {
        // 使用 mock event 確保 PrimeVue 選單精準對齊卡片容器
        rankMenu.value.toggle({ currentTarget: el, target: el });
    }
};

const onRankClick = (event: Event, record: Record) => {
    if (!props.deletable) return;
    selectedRecord.value = record;
    rankMenu.value.toggle(event);
};

const handleUnlink = async (record: Record) => {
    const updatedRecord = {
        ...record,
        autoUpdate: false
    };
    await recordsStore.onAddRecordForm(updatedRecord);
    UIStore.showToast('success', '取消連結成功', `已將 ${record.title} 取消自動更新連結，現在可手動修改資料`);
};

const menuItems = computed(() => {
    if (!selectedRecord.value) return [];
    
    const items = [];
    
    // 如果是自動更新，顯示取消連結選項
    if (selectedRecord.value.autoUpdate) {
        items.push({
            label: '取消自動更新連結',
            icon: 'pi pi-link-slash',
            command: () => {
                if (selectedRecord.value) {
                    handleUnlink(selectedRecord.value);
                }
            }
        });
    }
    
    // 刪除選項
    items.push({
        label: '刪除成績紀錄',
        icon: 'pi pi-trash',
        class: 'text-red-500',
        command: () => {
            if (selectedRecord.value) {
                onDeleteClick(selectedRecord.value);
            }
        }
    });
    
    return items;
});

const formatScore = (score: number | null) => {
    if (score == null) return '-';
    return score.toFixed(4);
};

const onEditClick = (record: Record) => {
    UIStore.editingRecord = record;
    UIStore.isAddDialogOpen = true;
};

const onScoreUpdateClick = (record: Record) => {
    UIStore.scoreInputRecord = record;
    UIStore.isScoreInputDialogOpen = true;
};

const onDeleteClick = (record: Record) => {
    emit('request-delete', record);
};

const getCardStyle = (lastUpdate: number) => {
    if (!props.showFading || !lastUpdate) {
        return {};
    }

    const now = Date.now();
    const diffMinutes = (now - lastUpdate) / (1000 * 60);
    const timeThresholds = [15, 30, 60, 180, 1440, 4320, 10080, 20160];

    let level = timeThresholds.findIndex(threshold => diffMinutes <= threshold);
    if (level === -1) {
        level = timeThresholds.length - 1;
    }

    const baseHue = props.setting.baseHue;
    const maxLevels = props.setting.maxLevels;

    const minLightness = 45;
    const maxLightness = 90;
    const maxSaturation = 85;
    const minSaturation = 40;

    const currentLightness = minLightness + ((maxLightness - minLightness) / (maxLevels - 1)) * level;
    const currentSaturation = maxSaturation - ((maxSaturation - minSaturation) / (maxLevels - 1)) * level;

    return {
        borderLeft: `4px solid hsl(${baseHue}, ${currentSaturation}%, ${currentLightness}%) !important`
    };
};
</script>

<style scoped lang="scss">
.records-mobile-list-container {
    width: 100%;
    padding-bottom: 5.5rem; /* 預留空間，確保最後一筆紀錄能被推高至 FAB 上方，不被遮擋 */
}

.loading-state, .empty-state {
    padding: 2.5rem 1rem;
    text-align: center;
    color: var(--text-muted);
    font-size: 0.95rem;
    line-height: 1.6;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;

    .spinner-icon {
        font-size: 1.5rem;
        color: #3b82f6;
    }
}

.cards-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.record-card {
    background: var(--bg-card) !important;
    border: 1px solid var(--border-color) !important;
    border-radius: 12px !important;
    padding: 0;
    overflow: hidden;
    transition: border-color 0.25s, background-color 0.25s, box-shadow 0.25s;
    box-shadow: none !important;

    :deep(.p-card-body), :deep(.p-card-content) {
        padding: 0 !important;
    }

    &.expanded {
        border-color: rgba(59, 130, 246, 0.3) !important;
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
        // 動畫結束自動還原
    }
}

.card-header {
    display: none; // 舊的 header 隱藏，改用 card-main-layout
}

.card-main-layout {
    display: flex;
    width: 100%;
    min-height: 50px;
    align-items: stretch;
    position: relative;
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

:deep(.p-menu) {
    background: var(--dialog-bg) !important;
    border: 1px solid var(--border-color) !important;
    box-shadow: var(--card-shadow) !important;
    border-radius: 8px !important;
    padding: 0.25rem 0 !important;
}

.menu-item-custom {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.65rem 1rem;
    cursor: pointer;
    color: var(--text-color);
    font-size: 0.9rem;
    font-weight: 500;
    transition: background-color 0.2s;
    user-select: none;
    -webkit-tap-highlight-color: transparent;

    &:hover, &:active {
        background-color: var(--options-bg);
    }

    &.text-red-500 {
        color: #ef4444 !important;
        .menu-item-icon {
            color: #ef4444 !important;
        }
    }
}

.menu-item-icon {
    font-size: 0.95rem;
    color: var(--text-muted);
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

// 展開/收合動畫 (slide-fade)
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
