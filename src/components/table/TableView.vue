<template>
    <div class="app-layout">
        <main>

            <div class="edit-hint hidden-on-mobile">
                <span v-if="!currentUser">您目前使用的是 <b>本機暫存模式</b>，清除瀏覽器資料會導致成績遺失。登入即可永久保存並跨裝置同步！</span>
                <span v-else>點擊儲存格直接編輯。按 <b>Enter</b> 儲存，按 <b>Esc</b> 取消。點擊最左側的<b>「排名 (#)」</b>可刪除該筆紀錄。</span>
            </div>

<!--            <RecordsActions-->
<!--                class="bottom-actions"-->
<!--                @request-add="handleAddFromDialog"-->
<!--                @request-import="handleImportData"-->
<!--                @request-export="exportToJson"-->
<!--            />-->

            <RecordsActions
                @request-add="handleAddFromDialog"
                @request-import="handleImportData"
                @request-export="exportToJson"
            />

            <RecordsTable
                :records="records"
                :isLoading="isLoading"
                :setting="{ logBase: 2, baseHue: 0, maxLevels: 7}"
                @request-update="handleUpdateFromTable"
                @request-delete="requestDelete"
            />

        </main>

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

    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useToast } from "primevue/usetoast";

import RecordsTable from "./recordTable/RecordsTable.vue";
import RecordsActions from "./recordActions/RecordsActions.vue";
import { ConfirmActionDialog, MergeDataDialog } from '../dialogs';

import { useAuthStore } from "../../stores/auth";
import { useRecordsStore } from "../../stores/records";
import { addRecordDataByRecord, deleteRecordDataByRecord, modifyRecordByRecord } from "../../utils/firestore";
import { calculatePlayPtt } from "../../utils/arcaea";
import { type Record, Difficulty } from "../../record";

// === 狀態與 Store 初始化 ===
const toast = useToast();
const authStore = useAuthStore();
const recordsStore = useRecordsStore();

const { currentUser } = storeToRefs(authStore);
const { records, isLoading } = storeToRefs(recordsStore);

// Props
const props = defineProps({
    'testing': { type: Boolean, default: false },
    'empty': { type: Boolean, default: false }
});

// Dialog 狀態
const showDeleteDialog = ref(false);
const showMergeDialog = ref(false);
const recordToDelete = ref<Record | null>(null);
const localRecordsCount = ref(0);

// === 統一呼叫 Toast 的輔助函數 ===
const showToast = (severity: 'success' | 'info' | 'warn' | 'error', summary: string, detail: string, life = 3000) => {
    toast.add({ severity, summary, detail, life });
};

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
    showToast('success', '合併成功', `已將 ${successCount} 筆本機紀錄同步至雲端`);
    await recordsStore.loadCloudRecords();
};

const executeDiscard = async () => {
    recordsStore.clearLocalRecords();
    showToast('info', '已捨棄', '已清空本機暫存紀錄', 2000);
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

        showToast('success', '匯入完成', `新增 ${addedCount} 筆，更新 ${updatedCount} 筆資料`, 4000);
    } catch (error: any) {
        showToast('error', '匯入過程發生錯誤', error.message, 4000);
    } finally {
        isLoading.value = false;
        if (currentUser.value) await recordsStore.loadCloudRecords();
    }
};

const exportToJson = () => {
    const dataStr = JSON.stringify(records.value, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `arcaea_records_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

// === 新增/更新資料核心模塊 ===

// 從 Dialog 接收新增/更新請求
const handleAddFromDialog = async (form: any) => {
    let parsedScore = form.score || 0;
    if (parsedScore > 1005) parsedScore = parsedScore / 10000;
    const parsedConstant = form.constant || 0;
    const title = form.title.trim();
    const difficulty = form.difficulty;
    const autoUpdate = form.autoUpdate || false; // 從表單獲取 AutoUpdate 屬性

    const existingRecordIndex = records.value.findIndex(r => r.title === title && r.difficulty === difficulty);
    const newPlayPtt = calculatePlayPtt(parsedConstant, parsedScore);

    if (existingRecordIndex !== -1) {
        // 資料已存在：執行更新流程
        const oldRecord = records.value[existingRecordIndex];
        const updatedRecord: Record = {
            ...oldRecord,
            constant: parsedConstant,
            score: parsedScore,
            playPtt: newPlayPtt,
            autoUpdate // 寫入是否自動更新屬性
        } as Record;
        await updateRecord(oldRecord, updatedRecord, { contextMsg: '從表單更新' });
    } else {
        // 資料不存在：執行新增流程
        const recordToSave: Record = {
            id: 'req_' + Date.now().toString(36),
            title: title,
            difficulty: difficulty,
            constant: parsedConstant,
            score: parsedScore,
            playPtt: newPlayPtt,
            lastUpdate: Date.now(),
            autoUpdate // 寫入是否自動更新屬性
        } as Record;
        await addRecord(recordToSave);
    }
};

// 從 Table 接收編輯請求
const handleUpdateFromTable = async (payload: { updatedData: Record, field: string, onSuccess: () => void, onError: () => void }) => {
    const { updatedData, field, onSuccess, onError } = payload;

    const oldRecord = records.value.find(r => r.id === updatedData.id);
    if (!oldRecord) {
        onError();
        return;
    }

    // 重新計算 playPtt (以防被修改的是 score 或 constant)
    updatedData.playPtt = calculatePlayPtt(updatedData.constant, updatedData.score);

    await updateRecord(oldRecord, updatedData, { onSuccess, onError, contextMsg: '更新成功' });
};

// 負責「執行更新」的底層函數
const updateRecord = async (oldRecord: Record, newRecord: Record, callbacks?: { onSuccess?: () => void, onError?: () => void, contextMsg?: string }) => {
    const { onSuccess, onError, contextMsg = '更新成功' } = callbacks || {};

    // 判斷是否需要更新 lastUpdate：只有當「分數改變」且「playPtt 提升」時才更新時間
    const isScoreChanged = newRecord.score !== oldRecord.score;
    const isPttIncreased = newRecord.playPtt > oldRecord.playPtt;

    if (isScoreChanged && isPttIncreased) {
        newRecord.lastUpdate = Date.now();
    } else {
        newRecord.lastUpdate = oldRecord.lastUpdate; // 沿用舊的時間
    }

    // 尋找舊排名並暫時移除
    const oldRankIndex = records.value.findIndex(r => r.id === oldRecord.id);

    if (oldRankIndex !== -1) {
        records.value.splice(oldRankIndex, 1);
    }

    // 樂觀更新：放入新資料並重新排序
    records.value.push(newRecord);
    records.value.sort((a, b) => b.playPtt - a.playPtt);

    const newRankIndex = records.value.findIndex(r => r.id === newRecord.id);
    const rankText = oldRankIndex !== newRankIndex
        ? `，排名從第 ${oldRankIndex + 1} 變更為第 ${newRankIndex + 1}`
        : `，維持第 ${newRankIndex + 1} 名`;

    if (currentUser.value) {
        try {
            await modifyRecordByRecord(currentUser.value, newRecord);
            if (onSuccess) onSuccess();
            showToast('success', contextMsg, `${newRecord.title} 已更新至雲端${rankText}`);
        } catch (error: any) {
            if (onError) onError();
            showToast('error', '更新失敗', error.message);
            // 失敗則還原 UI
            records.value = records.value.filter(r => r.id !== newRecord.id);
            records.value.push(oldRecord);
            records.value.sort((a, b) => b.playPtt - a.playPtt);
        }
    } else {
        recordsStore.saveLocalRecords(records.value);
        if (onSuccess) onSuccess();
        showToast('success', contextMsg, `${newRecord.title} 已暫存於本機${rankText}`);
    }
};

// 負責「執行新增」的底層函數
const addRecord = async (newRecord: Record) => {
    // 樂觀更新
    records.value.unshift(newRecord);
    records.value.sort((a, b) => b.playPtt - a.playPtt);
    const newRankIndex = records.value.findIndex(r => r.id === newRecord.id);
    console.log(newRecord)

    if (currentUser.value) {
        try {
            await addRecordDataByRecord(currentUser.value, newRecord);
            showToast('success', '新增成功', `${newRecord.title} 已儲存至雲端，排在第 ${newRankIndex + 1} 名`);
        } catch (error: any) {
            showToast('error', '新增失敗', error.message);
            // 失敗則還原 UI
            records.value = records.value.filter(r => r.id !== newRecord.id);
        }
    } else {
        recordsStore.saveLocalRecords(records.value);
        showToast('success', '新增成功', `${newRecord.title} 已暫存於本機，排在第 ${newRankIndex + 1} 名`);
    }
};

// === 刪除資料邏輯 (@request-delete) ===
const requestDelete = (record: Record) => {
    recordToDelete.value = record;
    showDeleteDialog.value = true;
};

const executeDelete = async () => {
    if (!recordToDelete.value) return;
    const record = recordToDelete.value;

    records.value = records.value.filter(r => r.id !== record.id);

    if (currentUser.value) {
        try {
            await deleteRecordDataByRecord(currentUser.value, record);
            showToast('success', '刪除成功', `${record.title} 已從雲端移除`, 2000);
        } catch (error: any) {
            showToast('error', '刪除失敗', error.message);
            records.value.push(record);
            records.value.sort((a, b) => b.playPtt - a.playPtt);
        }
    } else {
        recordsStore.saveLocalRecords(records.value);
        showToast('success', '刪除成功', `${record.title} 已從本機移除`, 2000);
    }
    recordToDelete.value = null;
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