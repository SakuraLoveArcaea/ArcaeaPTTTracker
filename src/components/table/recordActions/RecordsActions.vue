<template>
    <div class="actions-container" @keydown="onkeydown">
        <Button
            label="匯出"
            icon="pi pi-download"
            severity="secondary"
            outlined
            @click="handleExport"
            title="匯出 JSON"
            class="flex-1 md:flex-none"
        />
        <Button
            label="匯入"
            icon="pi pi-upload"
            severity="secondary"
            outlined
            @click="showImportDialog = true"
            title="匯入 JSON"
        />
        <Button
            label="新增"
            icon="pi pi-plus"
            severity="primary"
            @click="showAddDialog = true"
        />

        <AddRecordDialog
            v-model:visible="showAddDialog"
            @save="handleSave"
        />
        <ImportRecordDialog
            v-model:visible="showImportDialog"
            @import="handleImport"
        />
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Button from 'primevue/button';
// 請確認這裡的路徑是否與你的專案結構相符
import { AddRecordDialog, ImportRecordDialog } from '../../dialogs';

// 定義要傳遞給父層 (TableView) 的事件
const emit = defineEmits<{
    (e: 'request-add', form: any): void;
    (e: 'request-import', payload: { data: any[], overwrite: boolean, clearAll: boolean }): void;
    (e: 'request-export'): void;
}>();

// 管理 Dialog 顯示狀態
const showAddDialog = ref(false);
const showImportDialog = ref(false);

const handleExport = () => {
    emit('request-export');
};
// 接收來自 AddRecordDialog 的資料，並往上層傳遞
const handleSave = (form: any) => {
    emit('request-add', form);
    showAddDialog.value = false; // 送出後關閉彈窗
};

// 接收來自 ImportRecordDialog 的資料，並往上層傳遞
const handleImport = (payload: { data: any[], overwrite: boolean, clearAll: boolean }) => {
    emit('request-import', payload);
    showImportDialog.value = false; // 送出後關閉彈窗
};

const onkeydown = async (e: KeyboardEvent) => {
    // cmd+N 處罰新增紀錄按鈕
    if ((e.metaKey || e.ctrlKey) && e.code === 'KeyN') {
        e.preventDefault();
        console.log("press");
        showAddDialog.value = true;
    }
}
</script>

<style scoped>
.actions-container {
    display: flex;
    justify-content: flex-end; /* 桌面版靠右對齊 */
    align-items: center;
    gap: 1rem;
    padding: 0.5rem;
}



/* 行動裝置響應式設定 */
@media (max-width: 768px) {
    .actions-container {
        width: 100%;
        justify-content: space-between; /* 手機版按鈕等寬平分 */
    }
}
</style>