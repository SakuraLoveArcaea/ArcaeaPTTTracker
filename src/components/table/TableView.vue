<template>
    <div class="app-layout">
        <main>

            <div class="edit-hint hidden-on-mobile">
                <span v-if="!currentUser">您目前使用的是 <b>本機暫存模式</b>，清除瀏覽器資料會導致成績遺失。登入即可永久保存並跨裝置同步！</span>
                <span v-else>點擊儲存格直接編輯。按 <b>Enter</b> 儲存，按 <b>Esc</b> 取消。點擊最左側的<b>「排名 (#)」</b>可刪除該筆紀錄。</span>
            </div>


            <RecordsActions
                @request-add="onAddRecordForm"
                @request-import="handleImportData"
                @request-export="onExportRecordsToJson"
            />

            <RecordsTable
                :records="records"
                :isLoading="isLoading"
                :setting="{ logBase: 2, baseHue: 0, maxLevels: 7}"
                @request-update="onUpdateFromTable"
                @request-delete="onDelete"
            />

        </main>

        <ConfirmActionDialog
            v-model:visible="isDeleteDialogOpen"
            header="刪除確認"
            :message="`您確定要刪除「${recordToDelete?.title}」的成績嗎？刪除後無法復原。`"
            severity="danger"
            acceptLabel="刪除"
            cancelLabel="取消"
            @accept="deleteRecord"
            @cancel="recordToDelete = null"
        />

        <MergeDataDialog
            v-model:visible="showMergeDialog"
            :recordCount="localRecordsCount"
            @merge="executeMerge"
            @discard="executeDiscard"
        />

    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useToast } from "primevue/usetoast";

import RecordsTable from "./recordTable/RecordsTable.vue";
import RecordsActions from "./recordActions/RecordsActions.vue";
import { ConfirmActionDialog, MergeDataDialog } from '../dialogs';

import { useAuthStore } from "../../stores/authStore";
import { useRecordsStore } from "../../stores/recordsStore";
import { addRecordDataByRecord, deleteRecordDataByRecord, modifyRecordByRecord } from "../../utils/firestore";
import { calculatePlayPtt } from "../../utils/arcaea";
import { type Record, Difficulty } from "../../record";
import {useUIStore} from "../../stores/uiStore";

// === 狀態與 Store 初始化 ===
const authStore = useAuthStore();
const recordsStore = useRecordsStore();
const UIStore = useUIStore();

const { currentUser } = storeToRefs(authStore);
const { records, isLoading } = storeToRefs(recordsStore);
const { isDeleteDialogOpen, recordToDelete } = storeToRefs(recordsStore)
const { addRecord, updateRecord, deleteRecord, onExportRecordsToJson, onAddRecordForm, onUpdateFromTable, onDelete } = recordsStore


// Props
const props = defineProps({
    'testing': { type: Boolean, default: false },
    'empty': { type: Boolean, default: false }
});



const showMergeDialog = ref(false);
const localRecordsCount = ref(0);



// === 生命週期與監聽器 ===
onMounted(() => {
    if (props.testing) {
        if (props.empty) records.value = [];
        isLoading.value = false;
    }
});

watch(
    currentUser,
    async (newUser) => {
        if (props.testing) return;

        if (newUser) {
            const localData = recordsStore.loadLocalRecords();
            if (localData.length > 0) {
                localRecordsCount.value = localData.length;
                showMergeDialog.value = true;
            } else {
                await recordsStore.loadCloudRecords();
            }
        } else {
            await recordsStore.initLoad();
        }
    },
    { immediate: true }
);

// === 合併資料邏輯 (Merge Dialog) ===
/*
上傳 + 清除(本地)
 */
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
    UIStore.showToast('success', '合併成功', `已將 ${successCount} 筆本機紀錄同步至雲端`);
    await recordsStore.loadCloudRecords();
};

const executeDiscard = async () => {
    recordsStore.clearLocalRecords();
    UIStore.showToast('info', '已捨棄', '已清空本機暫存紀錄', 2000);
    await recordsStore.loadCloudRecords();
};

// === 匯入與匯出資料邏輯 ===
const handleImportData = async ({ data, overwrite, clearAll }: { data: any[], overwrite: boolean, clearAll: boolean }) => {
    isLoading.value = true;

    try {
        if (clearAll) {
            if (currentUser.value) {
                for (const r of records.value) await deleteRecordDataByRecord(currentUser.value, r);
            }
            records.value = [];
        }

        let addedCount = 0;
        let updatedCount = 0;

        for (const item of data) {
            let targetId = item.id;
            const parsedConstant = Number(item.constant) || 0;
            let parsedScore = Number(item.score) || 0;
            if (parsedScore > 1005) parsedScore = parsedScore / 10000;
            const autoCalculatedPtt = item.playPtt !== undefined ? Number(item.playPtt) : calculatePlayPtt(parsedConstant, parsedScore);
            const difficulty = (item.difficulty || 'FTR') as Difficulty;
            const title = item.title || 'Unknown';

            const existingIndex = records.value.findIndex(r => r.title === title && r.difficulty === difficulty);

            if (existingIndex > -1) {
                if (overwrite && !clearAll) targetId = records.value[existingIndex].id;
                else if (!clearAll) continue;
            }

            if (!targetId) targetId = 'imp_' + Math.random().toString(36).substring(2, 11);

            const cleanRecord: Record = { id: targetId, title, difficulty, constant: parsedConstant, score: parsedScore, playPtt: autoCalculatedPtt };

            if (currentUser.value) await addRecordDataByRecord(currentUser.value, cleanRecord);

            if (existingIndex > -1 && overwrite) {
                records.value[existingIndex] = cleanRecord;
                updatedCount++;
            } else if (existingIndex === -1) {
                records.value.push(cleanRecord);
                addedCount++;
            }
        }

        records.value.sort((a, b) => b.playPtt - a.playPtt);
        if (!currentUser.value) recordsStore.saveLocalRecords(records.value);

        UIStore.showToast('success', '匯入完成', `新增 ${addedCount} 筆，更新 ${updatedCount} 筆資料`, 4000);
    } catch (error: any) {
        UIStore.showToast('error', '匯入過程發生錯誤', error.message, 4000);
    } finally {
        isLoading.value = false;
        if (currentUser.value) await recordsStore.loadCloudRecords();
    }
};


</script>

<style scoped>

.app-layout { padding-bottom: 2rem; }

.bottom-actions {
    position: fixed;
    right: 0;
    top: 0;
    z-index: 50;
}

/* 提示訊息區塊 */
.edit-hint {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background-color: var(--p-surface-100, #f8f9fa);
    border-left: 4px solid var(--p-primary-color, #3b82f6);
    border-radius: 4px;
    font-size: 0.9rem;
    color: var(--p-text-color, #495057);
}

@media (max-width: 768px) {
    .hidden-on-mobile { display: none; }
}
</style>