<template>
    <div class="records-dashboard-container">
        <!-- 標題欄位 -->
        <div class="panel-header-row">
            <h3 class="panel-title">
                <i class="pi pi-list title-icon"></i>
                成績紀錄清單
            </h3>
        </div>
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
 
        <!-- 搜尋欄 -->
        <div class="search-bar-container">
            <div class="search-input-wrapper">
                <i class="pi pi-search search-icon"></i>
                <InputText
                    v-model="searchQuery"
                    placeholder="搜尋曲名、定數或難度 (例如: 風暴, 10.5, BYD)"
                    class="search-input"
                    fluid
                />
                <button v-if="searchQuery" class="clear-btn" @click="searchQuery = ''" type="button">
                    <i class="pi pi-times"></i>
                </button>
            </div>
        </div>

        <!-- 可複用的成績表格 (首頁設定為可編輯、可刪除，並接聽來自內部元件的操作事件) -->
        <div class="table-wrapper">
            <RecordsDispatcher
                :records="filteredRecords"
                :isLoading="isLoading"
                :setting="{ logBase: 2, baseHue: 142, maxLevels: 7}"
                :editable="true"
                :deletable="true"
                :showFading="true"
                @request-update="onUpdateFromTable"
                @request-delete="onDelete"
                @request-add="onAddRecordForm"
                @request-import="handleImportData"
                @request-export="onExportRecordsToJson"
            />
        </div>



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
import { ref, watch, onMounted, computed } from "vue";
import { storeToRefs } from "pinia";
import { debounce } from "lodash";
import InputText from "primevue/inputtext";

import RecordsDispatcher from "./RecordsDispatcher.vue";
import { MergeDataDialog } from '@tracker/shared/components/dialogs';

import { useAuthStore } from "@tracker/shared/stores/authStore";
import { useRecordsStore } from "@tracker/shared/stores/recordsStore";
import { useConfirm } from "primevue/useconfirm";
import { addRecordDataByRecord, deleteRecordDataByRecord } from "@tracker/shared/utils/firestoreClient";
import { calculatePlayPtt } from "@tracker/shared/utils/arcaeaRule";
import { type Record, Difficulty } from "@tracker/shared/utils/record";
import { useUIStore } from "@tracker/shared/stores/uiStore";

const authStore = useAuthStore();
const recordsStore = useRecordsStore();
const UIStore = useUIStore();
const confirm = useConfirm();

const { currentUser } = storeToRefs(authStore);
const { records, isLoading } = storeToRefs(recordsStore);
const { recordToDelete } = storeToRefs(recordsStore);
const { deleteRecord, onExportRecordsToJson, onAddRecordForm, onUpdateFromTable } = recordsStore;

const searchQuery = ref("");
const debouncedQuery = ref("");

const updateDebouncedQuery = debounce((val: string) => {
    debouncedQuery.value = val;
}, 150);

watch(searchQuery, (newVal) => {
    if (!newVal.trim()) {
        debouncedQuery.value = "";
        updateDebouncedQuery.cancel();
    } else {
        updateDebouncedQuery(newVal);
    }
});

const filteredRecords = computed(() => {
    const query = debouncedQuery.value.trim().toLowerCase();
    if (!query) return records.value;

    const queryNum = parseFloat(query);
    const isNum = !isNaN(queryNum);

    return records.value.filter(r => {
        const matchTitle = r.title.toLowerCase().includes(query);
        const matchDifficulty = r.difficulty.toLowerCase().includes(query);
        let matchConstant = false;
        if (isNum) {
            matchConstant = r.constant.toString().includes(query) || r.constant === queryNum;
        }
        return matchTitle || matchDifficulty || matchConstant;
    });
});

const onDelete = (record: Record) => {
    confirm.require({
        message: `您確定要刪除「${record.title}」的成績嗎？刪除後無法復原。`,
        header: '刪除確認',
        icon: 'pi pi-exclamation-triangle',
        rejectProps: { label: '取消', outlined: true, severity: 'secondary' },
        acceptProps: { label: '確認刪除', severity: 'danger' },
        accept: () => {
            recordsStore.recordToDelete = record;
            deleteRecord();
        }
    });
};

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
.records-dashboard-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.panel-header-row {
  margin-bottom: 1.25rem;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.05rem;
  font-weight: 700;
  color: #f8fafc;
  margin-top: 0;
  margin-bottom: 0;

  .title-icon {
    color: #3b82f6;
    font-size: 1.1rem;
  }
}

// 日間模式適應樣式 (Day/Light Mode)
:root:not(.p-dark) {
  .panel-title {
    color: #0f172a;
  }
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

.search-bar-container {
  width: 100%;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 400px;

  .search-icon {
    position: absolute;
    left: 0.75rem;
    color: #64748b;
    font-size: 0.9rem;
    pointer-events: none;
  }

  .search-input {
    padding-left: 2.25rem;
    padding-right: 2.25rem;
    width: 100%;
  }

  .clear-btn {
    position: absolute;
    right: 0.75rem;
    background: transparent;
    border: none;
    color: #64748b;
    cursor: pointer;
    padding: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s, color 0.2s;

    &:hover {
      background-color: rgba(255, 255, 255, 0.08);
      color: #f8fafc;
    }
  }
}

:root:not(.p-dark) {
  .search-input-wrapper {
    .search-icon, .clear-btn {
      color: #94a3b8;
    }
    .clear-btn:hover {
      background-color: rgba(0, 0, 0, 0.05);
      color: #0f172a;
    }
  }
}
</style>