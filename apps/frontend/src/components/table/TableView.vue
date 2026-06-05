<template>
    <div class="home-layout">
        <!-- 提示看板 -->
        <div class="edit-hint-banner">
            <i class="pi pi-info-circle hint-icon"></i>
            <span v-if="!currentUser" class="hint-text">
                您目前使用的是 <b>本機暫存模式</b>，清除瀏覽器快取會導致成績遺失。<b>登入即可永久儲存成績並跨平台同步！</b>
            </span>
            <span v-else class="hint-text">
                點擊儲存格直接編輯，按 <b>Enter</b> 儲存，按 <b>Esc</b> 取消。點擊最左側的 <b>排名 (#)</b> 可刪除紀錄。使用 <b>Cmd + K</b> 可喚醒快速錄入。
            </span>
        </div>

        <!-- 頂部操作按鈕 (新增/匯入/匯出) -->
        <div class="actions-wrapper">
            <RecordsActions
                @request-add="onAddRecordForm"
                @request-import="handleImportData"
                @request-export="onExportRecordsToJson"
            />
        </div>

        <!-- 可複用的成績表格 (首頁設定為可編輯、可刪除) -->
        <div class="table-wrapper">
            <RecordsTable
                :records="records"
                :isLoading="isLoading"
                :setting="{ logBase: 2, baseHue: 142, maxLevels: 7}"
                :editable="true"
                :deletable="true"
                :showFading="true"
                @request-update="onUpdateFromTable"
                @request-delete="onDelete"
            />
        </div>

        <!-- 刪除確認對話框 -->
        <ConfirmActionDialog
            v-model:visible="isDeleteDialogOpen"
            header="刪除確認"
            :message="`您確定要刪除「${recordToDelete?.title}」的成績嗎？刪除後無法復原。`"
            severity="danger"
            acceptLabel="確認刪除"
            cancelLabel="取消"
            @accept="deleteRecord"
            @cancel="recordToDelete = null"
        />

        <!-- 本地與雲端資料合併對話框 -->
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

import RecordsTable from "./recordTable/RecordsTable.vue";
import RecordsActions from "./recordActions/RecordsActions.vue";
import ConfirmActionDialog from '@/components/dialogs/ConfirmActionDialog.vue';
import MergeDataDialog from '@/components/dialogs/MergeDataDialog.vue';

import { useAuthStore } from "@/stores/authStore";
import { useRecordsStore } from "@/stores/recordsStore";
import { addRecordDataByRecord, deleteRecordDataByRecord } from "@/utils/firestoreClient";
import { calculatePlayPtt } from "@/utils/arcaeaRule";
import { type Record, Difficulty } from "@/utils/record";
import { useUIStore } from "@/stores/uiStore";

const authStore = useAuthStore();
const recordsStore = useRecordsStore();
const UIStore = useUIStore();

const { currentUser } = storeToRefs(authStore);
const { records, isLoading } = storeToRefs(recordsStore);
const { recordToDelete } = storeToRefs(recordsStore)
const { isDeleteDialogOpen } = storeToRefs(UIStore)
const { deleteRecord, onExportRecordsToJson, onAddRecordForm, onUpdateFromTable, onDelete } = recordsStore

const props = defineProps({
    'testing': { type: Boolean, default: false },
    'empty': { type: Boolean, default: false }
});

const showMergeDialog = ref(false);
const localRecordsCount = ref(0);

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

<style scoped lang="scss">
.home-layout {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

// 提示橫幅樣式 (Glassmorphism + 左側提醒框)
.edit-hint-banner {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.85rem 1.25rem;
  background: rgba(59, 130, 246, 0.08);
  border-left: 4px solid #3b82f6;
  border-radius: 6px;
  box-sizing: border-box;

  .hint-icon {
    color: #3b82f6;
    font-size: 1.1rem;
    margin-top: 0.15rem;
  }

  .hint-text {
    font-size: 0.85rem;
    color: #94a3b8;
    line-height: 1.5;
    
    b {
      color: #f8fafc;
    }
  }
}

.actions-wrapper {
  width: 100%;
}

.table-wrapper {
  width: 100%;
}

@media (max-width: 768px) {
  .edit-hint-banner {
    display: none; // 手機板自動隱藏複雜提示
  }
}

:root:not(.p-dark) {
  .edit-hint-banner {
    background: rgba(59, 130, 246, 0.05);
    border-color: #3b82f6;

    .hint-text {
      color: #475569;
      b {
        color: #0f172a;
      }
    }
  }
}
</style>