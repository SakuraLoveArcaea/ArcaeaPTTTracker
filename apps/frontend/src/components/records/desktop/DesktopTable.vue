<template>
    <div class="records-desktop-table-container">
        <!-- 頂部操作按鈕 (新增/匯入/匯出) -->
        <div class="actions-wrapper">
            <DesktopActions
                @request-add="(form) => $emit('request-add', form)"
                @request-import="(p) => $emit('request-import', p)"
                @request-export="() => $emit('request-export')"
            />
        </div>

        <DataTable
            :value="records"
            :loading="isLoading"
            size="small"
            sort-field="playPtt"
            :sort-order="-1"
            :edit-mode="editable ? 'cell' : undefined"
            @cell-edit-init="onCellEditInit"
            @cell-edit-complete="onCellEditComplete"
            @cell-edit-cancel="onCellEditCancel"
        >
            <template #empty>
                <div class="empty-state">
                    目前沒有任何成績。<br/>
                    <span v-if="editable">點擊右上角「新增」手動加入，或「匯入」現有資料。</span>
                </div>
            </template>

            <!-- 1. # 排名/刪除 欄位 -->
            <Column v-if="visibleColumns.includes('rank')" key="rank" class="column-rank" style="width: 50px">
                <template #header>
                    <span class="header">#</span>
                </template>
                <template #body="{ data, index }">
                    <Button v-if="deletable" class="body delete-btn" @click="requestDelete(data)" title="點擊刪除此成績" variant="text" severity="secondary">
                        <span class="rank-text">{{ index < 30 ? index + 1 : '-' }}</span>
                        <i class="pi pi-trash delete-icon"></i>
                    </Button>
                    <span v-else class="body plain-rank-text" :class="{ 'top-three': index < 3 }">
                        {{ index < 30 ? index + 1 : '-' }}
                    </span>
                </template>
            </Column>

            <!-- 2. 曲名 欄位 -->
            <Column v-if="visibleColumns.includes('title')" key="title" field="title" class="column-title">
                <template #header>
                    <span class="header">曲名</span>
                </template>
                <template #body="{ data }">
                    <span class="body title-span" :style="getTitleStyle(data.lastUpdate)">
                        {{ data.title }}
                        <small v-if="data.autoUpdate" class="db-badge" title="資料庫自動更新">
                            <i class="pi pi-link"></i>
                        </small>
                    </span>
                </template>
                <template #editor="{ data, field }">
                    <InputText class="editor" v-model="data[field]" :disabled="data.autoUpdate === true" autofocus fluid />
                </template>
            </Column>

            <!-- 3. 上次更新 欄位 -->
            <Column v-if="visibleColumns.includes('lastUpdate')" key="lastUpdate" field="lastUpdate" class="column-lastUpdate" style="width: 100px">
                <template #header>
                    <span class="header">上次更新</span>
                </template>
                <template #body="{ data }">
                    <span class="body date-text">
                        <small>{{ data.lastUpdate ? new Date(data.lastUpdate).toLocaleDateString() : '-' }}</small>
                    </span>
                </template>
            </Column>

            <!-- 4. 難度 欄位 -->
            <Column v-if="visibleColumns.includes('difficulty')" key="difficulty" field="difficulty" class="column-difficulty" style="width: 8rem">
                <template #header>
                    <span class="header">難度</span>
                </template>
                <template #body="{ data }">
                    <span class="body diff-badge" :style="{ backgroundColor: diffColors[data.difficulty as Difficulty] }">
                        {{ data.difficulty }}
                    </span>
                </template>
                <template #editor="{ data, field }">
                    <Select class="editor" v-model="data[field]" :options="difficulties" :disabled="data.autoUpdate === true" autofocus fluid />
                </template>
            </Column>

            <!-- 5. 定數 欄位 -->
            <Column v-if="visibleColumns.includes('constant')" key="constant" field="constant" class="column-constant" style="width: 6rem">
                <template #header>
                    <span class="header">定數</span>
                </template>
                <template #body="{ data }">
                    <span class="body constant-text">{{ data.constant.toFixed(1) }}</span>
                </template>
                <template #editor="{ data, field }">
                    <InputNumber class="editor" v-model="data[field]" :minFractionDigits="1" :maxFractionDigits="1" :disabled="data.autoUpdate === true" autofocus fluid />
                </template>
            </Column>

            <!-- 6. 分數 欄位 -->
            <Column v-if="visibleColumns.includes('score')" key="score" field="score" class="column-score" style="width: 8rem">
                <template #header>
                    <span class="header">分數</span>
                </template>
                <template #body="{ data }">
                    <span 
                        class="body score-text" 
                        :class="{ 'clickable-score-cell': editable && UIStore.useExperimentalScoreInput }"
                        @click="editable && UIStore.useExperimentalScoreInput ? onScoreCellClick($event, data) : null"
                        :title="editable && UIStore.useExperimentalScoreInput ? '點擊使用鍵盤更新分數' : undefined"
                    >
                        {{ data.score.toFixed(4) }}
                    </span>
                </template>
                <template #editor="{ data, field }">
                    <InputNumber class="editor" v-model="data[field]" :minFractionDigits="4" :maxFractionDigits="4" autofocus fluid />
                </template>
            </Column>

            <!-- 7. playPtt 欄位 -->
            <Column v-if="visibleColumns.includes('playPtt')" key="playPtt" field="playPtt" sortable class="column-ptt" style="width: 6rem">
                <template #header>
                    <span class="header">playPtt</span>
                </template>
                <template #body="{ data }">
                    <span class="body ptt-text">{{ data.playPtt.toFixed(4) }}</span>
                </template>
            </Column>
        </DataTable>

        <!-- 浮動儲存/取消動作列 -->
        <Teleport to="body">
            <Transition name="editconfirm">
                <div v-if="isEditing && editable" class="floating-action-bar">
                    <div class="editing-actions">
                        <Button label="取消" severity="secondary" outlined @mousedown.prevent="handleCancel" class="flex-1" />
                        
                        <!-- 連結 / 斷開資料庫按鈕 -->
                        <Button 
                            v-if="editingRowRecord && !editingRowRecord.autoUpdate"
                            label="連結資料庫" 
                            icon="pi pi-link"
                            severity="info" 
                            outlined
                            @mousedown.prevent="handleOpenBindDialog" 
                            class="flex-1" 
                        />
                        <Button 
                            v-else-if="editingRowRecord && editingRowRecord.autoUpdate"
                            label="解除綁定" 
                            icon="pi pi-link-slash"
                            severity="warn" 
                            outlined
                            @mousedown.prevent="handleUnlinkCurrentSong" 
                            class="flex-1" 
                        />
                        
                        <Button 
                            v-if="!isCurrentCellDisabled"
                            label="儲存" 
                            severity="primary" 
                            @mousedown.prevent="handleSave" 
                            class="flex-1" 
                        />
                    </div>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { type PropType, ref } from "vue";
import { Difficulty, type Record } from "@/utils/record";
import DataTable from "primevue/datatable";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import Column from "primevue/column";
import Select from "primevue/select";
import Button from "primevue/button";
import { useToast } from "primevue/usetoast";
import { useUIStore } from "@/stores/uiStore";
import { useRecordsStore } from "@/stores/recordsStore";
import { useConfirm } from "primevue/useconfirm";
import DesktopActions from "./DesktopActions.vue";

const UIStore = useUIStore();
const recordsStore = useRecordsStore();
const confirm = useConfirm();

const props = defineProps({
    records: {
        type: Array as PropType<Record[]>,
        default: () => []
    },
    isLoading: {
        type: Boolean,
        default: false
    },
    setting: {
        type: Object as PropType<{ logBase: number, baseHue: number, maxLevels: number, unitMinutes?: number }>,
        default: () => ({ logBase: 2, baseHue: 142, maxLevels: 7 })
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
    visibleColumns: {
        type: Array as PropType<string[]>,
        default: () => ['rank', 'title', 'lastUpdate', 'difficulty', 'constant', 'score', 'playPtt']
    }
});

const emit = defineEmits<{
    (e: 'request-update', payload: { updatedData: Record, field: string, onSuccess: () => void, onError: () => void }): void;
    (e: 'request-delete', record: Record): void;
    (e: 'request-add', form: any): void;
    (e: 'request-import', payload: { data: any[], overwrite: boolean, clearAll: boolean }): void;
    (e: 'request-export'): void;
}>();

const toast = useToast();

const difficulties = ref<Difficulty[]>(['PST', 'PRS', 'FTR', 'BYD', 'ETR']);
const diffColors: Record<Difficulty, string> = {
    'PST': '#5aa1d9',
    'PRS': '#81b144',
    'FTR': '#a155ab',
    'BYD': '#d63d41',
    'ETR': '#c4a1d1'
};

// 行內編輯狀態管理
const isEditing = ref(false);
const activeCellCount = ref(0);
const originalRecord = ref<Record | null>(null);
const isCurrentCellDisabled = ref(false);
const editingRowRecord = ref<Record | null>(null);

const onCellEditInit = (event: any) => { 
    if (!props.editable) return;
    const { data, field } = event;
    // 儲存原始資料以備取消之用
    originalRecord.value = { ...data };
    editingRowRecord.value = data;
    activeCellCount.value++; 
    isEditing.value = true; 
    
    // 判斷當前編輯的儲存格是否為唯讀 (data.autoUpdate === true 且編輯非分數的自動更新欄位)
    isCurrentCellDisabled.value = data.autoUpdate === true && ['title', 'difficulty', 'constant'].includes(field);
};

const closeEditBar = () => {
    activeCellCount.value = Math.max(0, activeCellCount.value - 1);
    setTimeout(() => { 
        if (activeCellCount.value === 0) {
            isEditing.value = false;
            isCurrentCellDisabled.value = false;
            editingRowRecord.value = null;
        } 
    }, 150);
};

const forceCloseBar = () => { 
    activeCellCount.value = 0; 
    isEditing.value = false; 
    originalRecord.value = null;
    isCurrentCellDisabled.value = false;
    editingRowRecord.value = null;
};

const onCellEditCancel = () => closeEditBar();

// 數據校驗與 Emit
const onCellEditComplete = (event: any) => {
    if (!props.editable) return;
    closeEditBar();
    const { data, newValue, field, revert } = event;

    // 校驗格式
    if (field === 'title') {
        if (!newValue || String(newValue).trim() === '') {
            toast.add({ severity: 'error', summary: '格式錯誤', detail: '標題不能為空！', life: 3000 });
            if (revert) revert();
            return;
        }
    } else if (field === 'constant') {
        if (newValue == null || newValue <= 0 || newValue > 13) {
            toast.add({ severity: 'error', summary: '格式錯誤', detail: '定數範圍錯誤', life: 3000 });
            if (revert) revert();
            return;
        }
    } else if (field === 'score') {
        if (newValue == null || newValue < 0 || newValue > 1005) {
            toast.add({ severity: 'error', summary: '格式錯誤', detail: '分數格式錯誤', life: 3000 });
            if (revert) revert();
            return;
        }
    }

    if (data[field] === newValue) return;

    const updatedData = { ...data, [field]: newValue };

    emit('request-update', {
        updatedData,
        field,
        onSuccess: () => {},
        onError: () => {
            if (revert) revert();
        }
    });
};

const handleSave = () => {
    const activeEl = document.activeElement as HTMLElement;
    if (activeEl && activeEl.tagName !== 'BODY') {
        activeEl.blur(); // 觸發儲存 (會調用 onCellEditComplete)
    }
    forceCloseBar();
};

const handleCancel = () => {
    // 1. 還原原始資料
    if (originalRecord.value) {
        const record = props.records.find(r => r.id === originalRecord.value.id);
        if (record) {
            Object.assign(record, originalRecord.value);
        }
    }
    
    // 2. 讓輸入框失去焦點以退出編輯模式 (這會觸發 onCellEditComplete，但因為資料已還原，所以保存的是舊資料)
    const activeEl = document.activeElement as HTMLElement;
    if (activeEl && activeEl.tagName !== 'BODY') {
        activeEl.blur();
    }
    
    forceCloseBar();
};

const requestDelete = (record: Record) => {
    if (!props.deletable) return;
    emit('request-delete', record);
};

// 計算時間褪色
const getTitleStyle = (lastUpdate: number) => {
    if (!props.showFading || !lastUpdate) {
        return { borderLeft: '4px solid transparent' };
    }

    const now = Date.now();
    const diffMinutes = (now - lastUpdate) / (1000 * 60);

    const logBase = props.setting.logBase || 2;
    const maxLevels = props.setting.maxLevels || 7;
    const unitMinutes = props.setting.unitMinutes || 15; // 預設 15 分鐘

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
        borderLeft: `4px solid hsl(${baseHue}, ${currentSaturation}%, ${currentLightness}%)`
    };
};

const onScoreCellClick = (event: MouseEvent, record: Record) => {
    event.stopPropagation(); // 阻止事件冒泡，防止觸發 PrimeVue 的行內編輯
    UIStore.scoreInputRecord = record;
    UIStore.isScoreInputDialogOpen = true;
};

const handleOpenBindDialog = () => {
    if (!editingRowRecord.value) return;
    const recordToBind = editingRowRecord.value;
    handleCancel(); // 退出行內編輯
    UIStore.editingRecord = recordToBind;
    UIStore.isAddDialogOpen = true;
};

const handleUnlinkCurrentSong = () => {
    if (!editingRowRecord.value) return;
    const record = editingRowRecord.value;
    confirm.require({
        message: `您確定要取消「${record.title}」的自動更新連結嗎？\n取消連結後，您將可以手動編輯其曲名、定數與難度。`,
        header: '取消自動更新連結',
        icon: 'pi pi-link-slash',
        rejectProps: { label: '取消', outlined: true, severity: 'secondary' },
        acceptProps: { label: '確定斷開', severity: 'warning' },
        accept: async () => {
            handleCancel(); // 退出行內編輯
            const updatedRecord = {
                ...record,
                autoUpdate: false
            };
            await recordsStore.onAddRecordForm(updatedRecord);
            UIStore.showToast('success', '取消連結成功', `已將 ${record.title} 取消自動更新連結，現在可手動修改資料`);
        }
    });
};
</script>

<style scoped lang="scss">
.records-desktop-table-container {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.actions-wrapper {
  width: 100%;
}

.empty-state {
  padding: 2.5rem;
  text-align: center;
  color: var(--text-muted);
  font-size: 1rem;
  line-height: 1.6;
}

// 欄位標頭與本體通用排版
.header {
  display: block;
  width: 100%;
  text-align: center;
  font-weight: 700;
  font-size: 0.85rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.body {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  box-sizing: border-box;
}

// 曲名欄位靠左排版
.column-title {
  .body {
    justify-content: flex-start;
    padding: 0 1rem;
    font-weight: 500;
  }
}

.title-span {
  transition: border-color 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  height: 100%;
}

.db-badge {
  color: #3b82f6;
  font-size: 0.8rem;
  display: inline-flex;
  align-items: center;
  opacity: 0.8;
}

// 排名欄位特殊效果
.column-rank {
  .delete-btn {
    border: none !important;
    background: transparent !important;
    box-shadow: none !important;
    padding: 0 !important;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 100%;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    color: var(--text-muted);

    .delete-icon {
      display: none;
      color: #ef4444;
      font-size: 0.9rem;
    }

    &:hover {
      background-color: rgba(239, 68, 68, 0.15) !important;
      border-radius: 6px;

      .rank-text {
        display: none;
      }
      .delete-icon {
        display: block;
      }
    }
  }

  .plain-rank-text {
    font-weight: 600;
    color: var(--text-muted);
    
    &.top-three {
      color: #f59e0b; // 前三名呈現金黃色加亮
      font-weight: 700;
    }
  }
}

// 難度 Badge 樣式
.diff-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  color: #ffffff;
  font-weight: 700;
  font-size: 0.8rem;
  min-width: 3.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

// 文字特別樣式
.constant-text, .score-text {
  font-family: 'Courier New', Courier, monospace;
  font-weight: 600;
}

.ptt-text {
  font-family: 'Courier New', Courier, monospace;
  font-weight: 700;
  color: #3b82f6;
}

.date-text {
  color: var(--text-muted);
}

// 編輯器尺寸一致化
.editor {
  height: 36px;
  width: 100%;
}

// 浮動操作面板
.floating-action-bar {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 450px;
  padding: 0.75rem;
  background: rgba(30, 41, 59, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  display: flex;
  gap: 1rem;
  z-index: 1000;
}

.editing-actions {
  width: 100%;
  display: flex;
  gap: 0.5rem;
}

// 浮動操作面板 Transition 動畫 (進入與離開)
.editconfirm-enter-active, .editconfirm-leave-active {
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
}

.editconfirm-enter-from, .editconfirm-leave-to {
  transform: translate(-50%, calc(100% + 2.5rem)) scale(0.96) !important;
  opacity: 0;
}

.editconfirm-enter-to, .editconfirm-leave-from {
  transform: translate(-50%, 0) scale(1) !important;
  opacity: 1;
}

// 編輯器禁用狀態樣式 (使電腦版編輯 disable 更加明顯)
.editor {
  height: 36px;
  width: 100%;

  &.p-disabled, &:disabled, :deep(.p-disabled), :deep(.p-inputtext:disabled), :deep(input:disabled) {
    cursor: not-allowed !important;
    background-color: var(--options-bg) !important;
    color: var(--text-muted) !important;
    opacity: 0.75 !important;
    border-style: dashed !important;
    border-color: var(--border-color) !important;

    // 針對 Select 和 InputText 內部的 input 處理
    :deep(.p-select-label), :deep(.p-inputtext), :deep(input) {
      color: var(--text-muted) !important;
      cursor: not-allowed !important;
    }
    
    * {
      cursor: not-allowed !important;
    }
  }
}

.score-text {
  &.clickable-score-cell {
    cursor: pointer !important;
    color: #3b82f6 !important;
    transition: all 0.2s ease !important;
    padding: 0 0.5rem !important;
    border-radius: 4px !important;

    &:hover {
      color: #60a5fa !important;
      background: rgba(59, 130, 246, 0.08) !important;
    }
  }
}
</style>
