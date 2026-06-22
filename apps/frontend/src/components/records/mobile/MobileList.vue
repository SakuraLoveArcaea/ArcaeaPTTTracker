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
    </div>
</template>

<script setup lang="ts">
import { ref, PropType, watch, computed } from 'vue';
import { Record } from '@/utils/record';
import Menu from 'primevue/menu';
import { useUIStore } from '@/stores/uiStore';
import { useRecordsStore } from '@/stores/recordsStore';
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

// 處理來自子組件的長按事件
const onCardLongPress = (payload: { el: HTMLElement, record: Record }) => {
    if (!props.deletable) return;
    selectedRecord.value = payload.record;
    if (rankMenu.value && payload.el) {
        // 使用 mock event 確保 PrimeVue 選單精準對齊卡片容器
        rankMenu.value.toggle({ currentTarget: payload.el, target: payload.el });
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
</style>
