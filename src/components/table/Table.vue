<template>
    <div class="app-layout bg-slate-50 min-h-screen flex flex-col">
        <main class="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full table-container relative">

            <div class="edit-hint hidden-on-mobile mb-4">
                <i class="pi pi-info-circle"></i>
                <span v-if="!currentUser">您目前使用的是 <b>本機暫存模式</b>，清除瀏覽器資料會導致成績遺失。登入即可永久保存並跨裝置同步！</span>
                <span v-else>點擊儲存格直接編輯。按 <b>Enter</b> 儲存，按 <b>Esc</b> 取消。點擊最左側的<b>「排名 (#)」</b>可刪除該筆紀錄。</span>
            </div>

            <DataTable
                :value="records"
                :loading="isLoading"
                size="small"
                sort-field="playPtt"
                sort-order="-1"
                edit-mode="cell"
                class="editable-cells-table shadow-sm rounded-lg overflow-hidden"
                @cell-edit-init="onCellEditInit"
                @cell-edit-complete="onCellEditComplete"
                @cell-edit-cancel="onCellEditCancel"
            >
                <template #header>
                    <div class="table-header">
                        <!-- Stats removed from Table since they are now in NavBar -->
                        <div class="actions-container flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0 ml-auto">
                            <Button label="匯入" icon="pi pi-upload" severity="secondary" outlined @click="showImportDialog = true" title="匯入 JSON" class="flex-1 md:flex-none" />
                            <Button label="新增" icon="pi pi-plus" severity="primary" @click="showAddDialog = true" class="flex-1 md:flex-none" />
                        </div>
                    </div>
                </template>

                <template #empty>
                    <div class="text-center p-8 text-gray-500">
                        <i class="pi pi-folder-open text-4xl mb-4 block"></i>
                        目前沒有任何成績。<br/>點擊右上角「新增」手動加入，或「匯入」現有資料。
                    </div>
                </template>

                <Column style="width: 70px;" headerStyle="text-align: center;">
                    <template #header><div class="cell-content font-bold justify-center"><b>#</b></div></template>
                    <template #body="slotProps">
                        <div class="cell-content font-bold justify-center relative clickable-rank" :class="slotProps.index < 30 ? 'top-30-rank' : 'rest-rank'" @click="requestDelete(slotProps.data)" title="點擊刪除此紀錄">
                            <span>{{ slotProps.index < 30 ? slotProps.index + 1 : '-' }}</span>
                            <i class="pi pi-trash delete-icon"></i>
                        </div>
                    </template>
                </Column>
                <Column field="title" style="min-width: 150px;" headerStyle="text-align: left;">
                    <template #header><div class="cell-content font-bold justify-center"><b>標題</b></div></template>
                    <template #body="slotProps"><div class="cell-content text-left">{{ slotProps.data.title }}</div></template>
                    <template #editor="slotProps"><InputText v-model="slotProps.data.title" autofocus fluid class="full-width-input align-left" /></template>
                </Column>
                <Column field="difficulty" style="width: 120px;" headerStyle="text-align: center;">
                    <template #header><div class="cell-content font-bold justify-center"><b>難度</b></div></template>
                    <template #body="slotProps">
                        <div class="cell-content font-bold justify-center gap-2" :class="slotProps.data.difficulty.toLowerCase()">
                            <span>{{ slotProps.data.difficulty }}</span><i class="pi pi-chevron-down opacity-60 text-xs"></i>
                        </div>
                    </template>
                    <template #editor="slotProps"><Select v-model="slotProps.data.difficulty" :options="difficulties" autofocus fluid class="full-width-input custom-select" /></template>
                </Column>
                <Column field="constant" style="width: 100px;" headerStyle="text-align: center;">
                    <template #header><div class="cell-content font-bold justify-center"><b>定數</b></div></template>
                    <template #body="slotProps"><div class="cell-content justify-center">{{ slotProps.data.constant.toFixed(1) }}</div></template>
                    <template #editor="slotProps"><InputNumber v-model="slotProps.data.constant" :minFractionDigits="1" :maxFractionDigits="1" autofocus fluid class="full-width-input" /></template>
                </Column>
                <Column field="score" style="width: 120px;" headerStyle="text-align: center;">
                    <template #header><div class="cell-content font-bold justify-center"><b>分數</b></div></template>
                    <template #body="slotProps"><div class="cell-content justify-center">{{ slotProps.data.score.toFixed(4) }}</div></template>
                    <template #editor="slotProps"><InputNumber v-model="slotProps.data.score" :minFractionDigits="4" :maxFractionDigits="4" autofocus fluid class="full-width-input" /></template>
                </Column>
                <Column field="playPtt" sortable="desc" style="width: 100px;" headerStyle="text-align: center;">
                    <template #header><div class="cell-content font-bold justify-center"><b>playPtt</b></div></template>
                    <template #body="slotProps"><div class="cell-content justify-center font-bold ptt-text">{{ slotProps.data.playPtt.toFixed(4) }}</div></template>
                </Column>
            </DataTable>

            <div v-if="isEditing" class="floating-action-bar">
                <Button label="取消" icon="pi pi-times" severity="secondary" outlined @mousedown.prevent="triggerCancel" class="flex-1" />
                <Button label="儲存" icon="pi pi-check" severity="primary" @mousedown.prevent="triggerSave" class="flex-1" />
            </div>
        </main>

        <!-- Dialogs -->
        <AddRecordDialog v-model:visible="showAddDialog" @save="onSaveNewRecord" />
        
        <ConfirmActionDialog 
            v-model:visible="showDeleteDialog" 
            header="刪除確認" 
            :message="`您確定要刪除「${recordToDelete?.title}」的成績嗎？刪除後無法復原。`"
            severity="danger"
            acceptLabel="刪除"
            cancelLabel="取消"
            @accept="executeDelete" 
            @cancel="recordToDelete = null"
        />

        <MergeDataDialog
            v-model:visible="showMergeDialog"
            :recordCount="localRecordsCount"
            @merge="executeMerge"
            @discard="executeDiscard"
        />

        <ImportRecordDialog
            v-model:visible="showImportDialog"
            @import="executeImport"
        />

    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { Difficulty, myRecords, Record } from "../../data";
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Button from 'primevue/button';
import { useToast } from "primevue/usetoast";
import { useAuthStore } from "../../stores/auth";
import { useRecordsStore } from "../../stores/records";
import { storeToRefs } from "pinia";
import { addRecordDataByRecord, deleteRecordDataByRecord, modifyRecordByRecord } from "../../utils/firestore";
import { calculatePlayPtt } from "../../utils/arcaea";

// Import Dialog Components
import { AddRecordDialog, ConfirmActionDialog, MergeDataDialog, ImportRecordDialog } from '../dialogs';

// composables
const toast = useToast();
const store = useAuthStore();
const recordsStore = useRecordsStore();

// variables
const currentUser = storeToRefs(store).currentUser;
const { records, isLoading } = storeToRefs(recordsStore);
const difficulties = ref<Difficulty[]>(['PST', 'PRS', 'FTR', 'BYD', 'ETR']);

// props
const props = defineProps({
    'testing': { type: Boolean, default: false },
    'empty': { type: Boolean, default: false }
});

onMounted(() => {
    if (props.testing) {
        if (props.empty) {
            records.value = [];
        } else {
            records.value = myRecords;
        }
        isLoading.value = false;
    }
});

// Dialog States
const showAddDialog = ref(false);
const showDeleteDialog = ref(false);
const showMergeDialog = ref(false);
const showImportDialog = ref(false);

const recordToDelete = ref<Record | null>(null);
const localRecordsCount = ref(0);

// watcher for Auth
watch(
    currentUser,
    async (newUser) => {
        if (props.testing) return;

        if (newUser) {
            // Logged in: Check local records first
            const localData = recordsStore.loadLocalRecords();
            if (localData.length > 0) {
                localRecordsCount.value = localData.length;
                showMergeDialog.value = true;
            } else {
                await recordsStore.loadCloudRecords();
            }
        } else {
            // Logged out / Guest: Load local records
            await recordsStore.initLoad();
        }
    },
    { immediate: true }
);

// --- Merge Dialog Handlers ---
const executeMerge = async () => {
    if (!currentUser.value) return;
    isLoading.value = true;
    const localData = recordsStore.loadLocalRecords();
    
    let successCount = 0;
    for (const record of localData) {
        try {
            await addRecordDataByRecord(currentUser.value, record);
            successCount++;
        } catch (e) {
            console.error("Failed to merge record:", record.title);
        }
    }
    
    recordsStore.clearLocalRecords();
    toast.add({ severity: 'success', summary: '合併成功', detail: `已將 ${successCount} 筆本機紀錄同步至雲端`, life: 3000 });
    await recordsStore.loadCloudRecords();
};

const executeDiscard = async () => {
    recordsStore.clearLocalRecords();
    toast.add({ severity: 'info', summary: '已捨棄', detail: '已清空本機暫存紀錄', life: 2000 });
    await recordsStore.loadCloudRecords();
};

// --- JSON Import Handler ---
const executeImport = async ({ data, overwrite, clearAll }: { data: any[], overwrite: boolean, clearAll: boolean }) => {
    showImportDialog.value = false;
    isLoading.value = true;

    try {
        if (clearAll) {
            if (currentUser.value) {
                // Delete all current cloud records
                for (const r of records.value) {
                    await deleteRecordDataByRecord(currentUser.value, r);
                }
            }
            records.value = [];
        }

        let addedCount = 0;
        let updatedCount = 0;

        for (const item of data) {
            let targetId = item.id;
            
            // Generate clean record
            const parsedConstant = Number(item.constant) || 0;
            let parsedScore = Number(item.score) || 0;
            if (parsedScore > 1005) { parsedScore = parsedScore / 10000; }
            const autoCalculatedPtt = item.playPtt !== undefined ? Number(item.playPtt) : calculatePlayPtt(parsedConstant, parsedScore);
            const difficulty = (item.difficulty || 'FTR') as Difficulty;
            const title = item.title || 'Unknown';

            // Check for duplicates
            const existingIndex = records.value.findIndex(r => r.title === title && r.difficulty === difficulty);
            
            if (existingIndex > -1) {
                if (overwrite && !clearAll) {
                    targetId = records.value[existingIndex].id; // update existing
                } else if (!clearAll) {
                    continue; // skip duplicate
                }
            }

            if (!targetId) targetId = 'imp_' + Math.random().toString(36).substr(2, 9);

            const cleanRecord: Record = { 
                id: targetId, 
                title: title, 
                difficulty: difficulty, 
                constant: parsedConstant, 
                score: parsedScore, 
                playPtt: autoCalculatedPtt 
            };

            if (currentUser.value) {
                await addRecordDataByRecord(currentUser.value, cleanRecord);
            }

            if (existingIndex > -1 && overwrite) {
                records.value[existingIndex] = cleanRecord;
                updatedCount++;
            } else if (existingIndex === -1) {
                records.value.push(cleanRecord);
                addedCount++;
            }
        }

        records.value.sort((a, b) => b.playPtt - a.playPtt);

        if (!currentUser.value) {
            recordsStore.saveLocalRecords(records.value);
        }

        toast.add({ 
            severity: 'success', 
            summary: '匯入完成', 
            detail: `新增 ${addedCount} 筆，更新 ${updatedCount} 筆資料`, 
            life: 4000 
        });

    } catch (error: any) {
        toast.add({ severity: 'error', summary: '匯入過程發生錯誤', detail: error.message, life: 4000 });
    } finally {
        isLoading.value = false;
        if (currentUser.value) {
            await recordsStore.loadCloudRecords();
        }
    }
};


// ================= 新增紀錄 =================
const onSaveNewRecord = async (form: any) => {
    if (!form.title.trim()) {
        toast.add({ severity: 'error', summary: '驗證失敗', detail: '標題不能為空白', life: 3000 });
        return;
    }

    let parsedScore = form.score || 0;
    if (parsedScore > 1005) parsedScore = parsedScore / 10000;
    const parsedConstant = form.constant || 0;

    const newId = 'req_' + Date.now().toString(36);
    const recordToSave: Record = {
        id: newId,
        title: form.title.trim(),
        difficulty: form.difficulty,
        constant: parsedConstant,
        score: parsedScore,
        playPtt: calculatePlayPtt(parsedConstant, parsedScore)
    };

    showAddDialog.value = false;
    
    // 樂觀更新 UI
    records.value.unshift(recordToSave);
    records.value.sort((a, b) => b.playPtt - a.playPtt);

    if (currentUser.value) {
        // 儲存至雲端
        try {
            await addRecordDataByRecord(currentUser.value, recordToSave);
            toast.add({ severity: 'success', summary: '新增成功', detail: `${recordToSave.title} 已儲存至雲端`, life: 2000 });
        } catch (error: any) {
            toast.add({ severity: 'error', summary: '新增失敗', detail: error.message, life: 3000 });
            // 還原
            records.value = records.value.filter(r => r.id !== newId);
        }
    } else {
        // 儲存至本機
        recordsStore.saveLocalRecords(records.value);
        toast.add({ severity: 'success', summary: '新增成功', detail: `${recordToSave.title} 已暫存於本機`, life: 2000 });
    }
};

// --- 刪除功能 ---
const requestDelete = (record: Record) => {
    recordToDelete.value = record;
    showDeleteDialog.value = true;
};

const executeDelete = async () => {
    if (!recordToDelete.value) return;
    const record = recordToDelete.value;
    
    // 樂觀更新 UI
    records.value = records.value.filter(r => r.id !== record.id);
    
    if (currentUser.value) {
        try {
            await deleteRecordDataByRecord(currentUser.value, record);
            toast.add({ severity: 'success', summary: '刪除成功', detail: `${record.title} 已從雲端移除`, life: 2000 });
        } catch (error: any) {
            toast.add({ severity: 'error', summary: '刪除失敗', detail: error.message, life: 3000 });
            // 還原記錄
            records.value.push(record);
            records.value.sort((a, b) => b.playPtt - a.playPtt);
        }
    } else {
        recordsStore.saveLocalRecords(records.value);
        toast.add({ severity: 'success', summary: '刪除成功', detail: `${record.title} 已從本機移除`, life: 2000 });
    }
    recordToDelete.value = null;
};

// --- 編輯與同步邏輯 ---
const isEditing = ref(false);
const activeCellCount = ref(0);
const onCellEditInit = () => { activeCellCount.value++; isEditing.value = true; };
const closeEditBar = () => { activeCellCount.value = Math.max(0, activeCellCount.value - 1); setTimeout(() => { if (activeCellCount.value === 0) isEditing.value = false; }, 150); };
const forceCloseBar = () => { activeCellCount.value = 0; isEditing.value = false; };
const onCellEditCancel = () => closeEditBar();
const triggerSave = () => { const activeEl = document.activeElement as HTMLElement; if (activeEl && activeEl.tagName !== 'BODY') activeEl.blur(); forceCloseBar(); };
const triggerCancel = () => { const activeEl = document.activeElement as HTMLElement; if (activeEl && activeEl.tagName !== 'BODY') { activeEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true })); activeEl.blur(); } forceCloseBar(); };

const onCellEditComplete = async (event: any) => {
    closeEditBar();
    const { data, newValue, field, revert } = event;
    let isModified = false;

    if (field === 'title') {
        if (!newValue || String(newValue).trim() === '') { toast.add({ severity: 'error', summary: '錯誤', detail: '標題不能為空！', life: 3000 }); if (revert) revert(); }
        else if (data[field] !== newValue) { data[field] = newValue; isModified = true; }
    } else if (field === 'difficulty') {
        if (data[field] !== newValue) { data[field] = newValue; isModified = true; }
    } else if (field === 'constant') {
        if (newValue == null || newValue <= 0 || newValue > 13) { toast.add({ severity: 'error', summary: '錯誤', detail: '定數範圍錯誤', life: 3000 }); if (revert) revert(); }
        else if (data[field] !== newValue) { data[field] = parseFloat(newValue.toFixed(1)); data.playPtt = calculatePlayPtt(data[field], data.score); isModified = true; }
    } else if (field === 'score') {
        if (newValue == null || newValue < 0 || newValue > 1005) { toast.add({ severity: 'error', summary: '錯誤', detail: '分數格式錯誤', life: 3000 }); if (revert) revert(); }
        else if (data[field] !== newValue) { data[field] = parseFloat(newValue.toFixed(4)); data.playPtt = calculatePlayPtt(data.constant, data[field]); isModified = true; }
    }

    if (isModified) {
        records.value.sort((a, b) => b.playPtt - a.playPtt);
        if (currentUser.value) {
            try {
                await modifyRecordByRecord(currentUser.value, data);
                toast.add({ severity: 'success', summary: '儲存成功', detail: `${data.title} 已更新`, life: 2000 });
            } catch (error: any) {
                toast.add({ severity: 'error', summary: '儲存失敗', detail: error.message, life: 3000 });
                if (revert) revert();
            }
        } else {
            recordsStore.saveLocalRecords(records.value);
            toast.add({ severity: 'success', summary: '儲存成功', detail: `${data.title} 已更新於本機`, life: 2000 });
        }
    }
};
</script>

<style scoped>
/* 版面框架設定 (確保 body 沒預設留白) */
:global(body) { margin: 0; padding: 0; }
.app-layout { padding-bottom: 2rem; }
.app-header { border-bottom: 1px solid var(--p-surface-200, #e2e8f0); }
.table-container { padding-bottom: 80px; }
.table-header {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 1rem;
    position: sticky;
    z-index: 2;
}

.actions-container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
}

/* 文字樣式 */
.text-primary { color: var(--p-primary-color, #3b82f6); }
.warning-text { color: #ef4444; font-size: 0.75rem; margin-left: 0.5rem; font-weight: normal; }

/* 刪除欄位 */
.clickable-rank { cursor: pointer; transition: background-color 0.2s; border-radius: 4px; }
.clickable-rank:hover { background-color: #fee2e2; color: #ef4444; }
.clickable-rank:hover .delete-icon { opacity: 1; transform: scale(1.1); }
.delete-icon { position: absolute; right: 8px; font-size: 0.8rem; color: #ef4444; opacity: 0.4; transition: all 0.2s; }

/* 其餘表格與浮動按鈕樣式 */
.edit-hint { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; background-color: var(--p-surface-100, #f8f9fa); border-left: 4px solid var(--p-primary-color, #3b82f6); border-radius: 4px; font-size: 0.9rem; color: var(--p-text-color, #495057); }
.floating-action-bar { position: fixed; bottom: 0; left: 0; width: 100%; padding: 1rem; background-color: var(--p-surface-0, #ffffff); box-shadow: 0 -4px 15px rgba(0, 0, 0, 0.1); display: flex; gap: 1rem; z-index: 1000; animation: slideUp 0.3s ease-out; padding-bottom: calc(1rem + env(safe-area-inset-bottom)); }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
.flex-1 { flex: 1; } .gap-2 { gap: 0.5rem; } .opacity-60 { opacity: 0.6; } .text-xs { font-size: 0.75rem; }
:deep(.editable-cells-table .p-datatable-tbody > tr > td) { padding: 0 !important; }
.cell-content { padding: 0.5rem 0.75rem; min-height: 40px; display: flex; align-items: center; box-sizing: border-box; width: 100%; }
.justify-center { justify-content: center; } .text-left { justify-content: flex-start; }
.top-30-rank { color: #a155ab; background-color: rgba(161, 85, 171, 0.05); } .rest-rank { color: var(--p-text-muted-color, #adb5bd); }
.ptt-text { color: var(--p-primary-color, #3b82f6); }
.pst { color: #5aa1d9; } .prs { color: #81b144; } .ftr { color: #a155ab; } .byd { color: #d63d41; } .etr { color: #c4a1d1; }
:deep(.full-width-input) { width: 100% !important; }
:deep(.full-width-input .p-inputtext), :deep(.full-width-input .p-inputnumber-input) { padding: 0.5rem 0.75rem; width: 100% !important; min-height: 40px; border-radius: 0; border: none; box-shadow: none; background-color: var(--p-surface-0, #ffffff); box-sizing: border-box; text-align: center; }
:deep(.align-left.p-inputtext) { text-align: left; }
:deep(.custom-select) { border: none; border-radius: 0; min-height: 40px; box-shadow: none; }
:deep(.custom-select .p-select-label) { padding: 0.5rem 0.75rem; display: flex; align-items: center; justify-content: center; }
:deep(.full-width-input .p-inputtext:focus), :deep(.full-width-input .p-inputnumber-input:focus), :deep(.custom-select:focus-within) { outline: 2px solid var(--p-primary-color, #3b82f6); outline-offset: -2px; }
@media (max-width: 768px) { .hidden-on-mobile { display: none; } .table-header { flex-direction: column; align-items: flex-start; } .actions-container { width: 100%; justify-content: space-between; } }
</style>