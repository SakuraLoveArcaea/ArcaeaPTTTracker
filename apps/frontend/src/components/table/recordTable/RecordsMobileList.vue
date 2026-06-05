<template>
    <div class="records-mobile-list-container">
        <div v-if="isLoading" class="loading-state">
            <i class="pi pi-spin pi-spinner spinner-icon"></i>
            <span>載入中...</span>
        </div>

        <div v-else-if="records.length === 0" class="empty-state">
            目前沒有任何成績。<br/>
            <span v-if="editable">點擊懸浮加號或右上角「新增」手動加入。</span>
        </div>

        <div v-else class="cards-wrapper">
            <div
                v-for="(record, index) in records"
                :key="record.id"
                class="record-card glass-panel"
                :class="{ 'expanded': expandedRecordId === record.id }"
            >
                <!-- 卡片頭部 (收合時可點擊展開) -->
                <div class="card-header" @click="toggleExpand(record.id)">
                    <div class="header-left">
                        <div class="rank-badge" :class="{ 'top-three': index < 3 }">
                            {{ index < 30 ? index + 1 : '-' }}
                        </div>
                        <div class="title-section">
                            <span class="song-title">
                                {{ record.title }}
                                <i v-if="record.autoUpdate" class="pi pi-link db-badge" title="資料庫自動更新"></i>
                            </span>
                            <span class="diff-badge" :style="{ backgroundColor: diffColors[record.difficulty] }">
                                {{ record.difficulty }}
                            </span>
                        </div>
                    </div>
                    <div class="header-right">
                        <span class="play-ptt">{{ record.playPtt.toFixed(4) }}</span>
                        <i class="pi chevron-icon" :class="expandedRecordId === record.id ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
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
                                <span class="detail-value font-monospace">{{ record.score.toLocaleString() }}</span>
                            </div>
                            <div class="detail-item full-width">
                                <span class="detail-label">上次更新時間</span>
                                <span class="detail-value">
                                    {{ record.lastUpdate ? new Date(record.lastUpdate).toLocaleString('zh-TW', { hour12: false }) : '-' }}
                                </span>
                            </div>
                        </div>

                        <!-- 編輯 / 刪除動作列 -->
                        <div v-if="editable || deletable" class="card-actions">
                            <Button
                                v-if="editable"
                                label="編輯成績"
                                icon="pi pi-pencil"
                                outlined
                                severity="secondary"
                                size="small"
                                class="action-btn"
                                @click="onEditClick(record)"
                            />
                            <Button
                                v-if="deletable"
                                label="刪除紀錄"
                                icon="pi pi-trash"
                                outlined
                                severity="danger"
                                size="small"
                                class="action-btn"
                                @click="onDeleteClick(record)"
                            />
                        </div>
                    </div>
                </transition>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, PropType } from 'vue';
import { Record, Difficulty } from '@/utils/record';
import Button from 'primevue/button';
import { useUIStore } from '@/stores/uiStore';

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

const onEditClick = (record: Record) => {
    UIStore.editingRecord = record;
    UIStore.isAddDialogOpen = true;
};

const onDeleteClick = (record: Record) => {
    emit('request-delete', record);
};
</script>

<style scoped lang="scss">
.records-mobile-list-container {
    width: 100%;
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
    background: rgba(30, 41, 59, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 0;
    overflow: hidden;
    transition: border-color 0.25s, background-color 0.25s;

    &.expanded {
        background: rgba(30, 41, 59, 0.45);
        border-color: rgba(59, 130, 246, 0.2);
    }
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.85rem 1rem;
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    flex: 1;
    min-width: 0;
}

.rank-badge {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--text-muted);
    flex-shrink: 0;

    &.top-three {
        color: #f59e0b;
        border-color: rgba(245, 158, 11, 0.3);
        background: rgba(245, 158, 11, 0.08);
    }
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
    color: #f8fafc;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: flex;
    align-items: center;
    gap: 0.35rem;

    .db-badge {
        font-size: 0.75rem;
        color: #3b82f6;
    }
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

.play-ptt {
    font-family: 'Courier New', Courier, monospace;
    font-weight: 700;
    font-size: 1rem;
    color: #3b82f6;
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
    background: rgba(255, 255, 255, 0.06);
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
    color: #cbd5e1;
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

// 日間模式適應樣式 (Day/Light Mode)
:root:not(.p-dark) {
    .record-card {
        background: rgba(255, 255, 255, 0.6);
        border-color: rgba(15, 23, 42, 0.05);

        &.expanded {
            background: rgba(255, 255, 255, 0.85);
            border-color: rgba(59, 130, 246, 0.15);
        }
    }

    .song-title {
        color: #0f172a;
    }

    .detail-divider {
        background: rgba(15, 23, 42, 0.06);
    }

    .detail-value {
        color: #334155;
    }
    
    .rank-badge {
        background: rgba(15, 23, 42, 0.03);
        border-color: rgba(15, 23, 42, 0.06);
    }
}
</style>
