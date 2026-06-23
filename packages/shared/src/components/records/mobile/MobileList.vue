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
            <!-- 將每一張卡片封裝為獨立子組件 -->
            <MobileCard
                v-for="(record, index) in records"
                :key="record.id"
                :record="record"
                :index="index"
                :is-expanded="expandedRecordId === record.id"
                :editable="editable"
                :show-fading="showFading"
                :setting="setting"
                @toggle-expand="toggleExpand(record.id)"
                @long-press="onCardLongPress"
            />
        </div>

        <!-- YouTube 搜尋確認對話框 -->
        <Dialog
            v-model:visible="showYoutubeSearchDialog"
            header="前往 YouTube 搜尋"
            modal
            :draggable="false"
            :dismissableMask="true"
            class="youtube-dialog"
            style="width: 90%; max-width: 400px;"
        >
            <div class="youtube-dialog-content">
                <div class="youtube-icon-wrapper">
                    <i class="pi pi-youtube"></i>
                </div>
                <div class="youtube-text">
                    <p class="confirm-message">是否前往 YouTube 搜尋此歌曲的譜面/手元？</p>
                    <p class="search-query-preview">搜尋關鍵字：<strong>{{ longPressRecord?.title }} {{ longPressRecord?.difficulty }}</strong></p>
                </div>
            </div>
            <template #footer>
                <div class="dialog-buttons">
                    <Button label="取消" outlined severity="secondary" @click="showYoutubeSearchDialog = false" class="dialog-btn" />
                    <Button label="搜尋" severity="danger" @click="confirmYoutubeSearch" class="dialog-btn" />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, PropType, watch, computed } from 'vue';
import { Record } from '@tracker/shared/utils/record';
import Menu from 'primevue/menu';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import { useUIStore } from '@tracker/shared/stores/uiStore';
import { useRecordsStore } from '@tracker/shared/stores/recordsStore';
import MobileCard from './MobileCard.vue';

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
        type: Object as PropType<{ baseHue: number; maxLevels: number; logBase: number; unitMinutes?: number }>,
        default: () => ({ baseHue: 142, maxLevels: 7, logBase: 2, unitMinutes: 15 })
    }
});

const emit = defineEmits<{
    (e: 'request-delete', record: Record): void;
}>();

const UIStore = useUIStore();
const recordsStore = useRecordsStore();

const expandedRecordId = ref<string | null>(null);
const rankMenu = ref<any>(null);
const selectedRecord = ref<Record | null>(null);

const toggleExpand = (id: string) => {
    if (rankMenu.value) {
        rankMenu.value.hide();
    }
    if (expandedRecordId.value === id) {
        expandedRecordId.value = null;
    } else {
        expandedRecordId.value = id;
    }
};

// 監聽來自 Pinia 的展開命令（圖表跳轉定位時觸發）
watch(() => UIStore.expandedRecordId, (newVal) => {
    if (newVal) {
        if (rankMenu.value) {
            rankMenu.value.hide();
        }
        expandedRecordId.value = newVal;
    }
});

// YouTube 搜尋與狀態
const showYoutubeSearchDialog = ref(false);
const longPressRecord = ref<Record | null>(null);

const confirmYoutubeSearch = () => {
    if (!longPressRecord.value) return;
    const record = longPressRecord.value;
    const query = encodeURIComponent(record.title + ' ' + record.difficulty);
    window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank');
    showYoutubeSearchDialog.value = false;
};

// 處理來自子組件的長按事件
const onCardLongPress = (payload: { el: HTMLElement, record: Record }) => {
    selectedRecord.value = payload.record;
    
    // 未展開長按且是已連結的紀錄 -> 觸發 YouTube
    if (expandedRecordId.value !== payload.record.id && payload.record.autoUpdate) {
        longPressRecord.value = payload.record;
        showYoutubeSearchDialog.value = true;
    } else {
        // 展開後長按，或者未展開但非連結紀錄 -> 彈出操作選單 (取消連結、刪除紀錄)
        if (!props.deletable) return;
        if (rankMenu.value && payload.el) {
            rankMenu.value.toggle({ currentTarget: payload.el, target: payload.el });
        }
    }
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
                emit('request-delete', selectedRecord.value);
            }
        }
    });
    
    return items;
});
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

/* YouTube Search Dialog Styling */
:deep(.youtube-dialog) {
  background: var(--dialog-bg) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 16px !important;
  box-shadow: var(--card-shadow) !important;
  backdrop-filter: var(--glass-blur) !important;
  -webkit-backdrop-filter: var(--glass-blur) !important;

  .p-dialog-header {
    background: var(--dialog-header-bg) !important;
    border-bottom: 1px solid var(--border-color) !important;
    padding: 1.25rem 1.5rem !important;
    color: var(--text-color) !important;
    font-weight: 700 !important;
  }

  .p-dialog-content {
    background: transparent !important;
    padding: 1.5rem !important;
  }

  .p-dialog-footer {
    background: var(--dialog-header-bg) !important;
    border-top: 1px solid var(--border-color) !important;
    padding: 0.75rem 1.5rem !important;
  }
}

.youtube-dialog-content {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  color: var(--text-color);
}

.youtube-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  flex-shrink: 0;
}

.youtube-text {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  
  .confirm-message {
    margin: 0;
    font-weight: 600;
    font-size: 0.95rem;
    line-height: 1.5;
  }
  
  .search-query-preview {
    margin: 0;
    font-size: 0.85rem;
    color: var(--text-muted);
    
    strong {
      color: var(--text-color);
      background: var(--options-bg);
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-family: inherit;
    }
  }
}

.dialog-buttons {
  display: flex;
  gap: 0.75rem;
  width: 100%;
  
  .dialog-btn {
    flex: 1;
  }
}
</style>
