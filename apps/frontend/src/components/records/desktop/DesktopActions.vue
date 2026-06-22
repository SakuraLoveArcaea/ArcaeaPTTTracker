<template>
    <div class="actions-container">
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
            @click="isImportDialogOpen = true"
            title="匯入 JSON"
        />
        <Button
            label="新增"
            icon="pi pi-plus"
            severity="primary"
            @click="isAddDialogOpen = true"
        />

        <ImportRecordDialog
            v-model:visible="isImportDialogOpen"
            @import="handleImport"
        />
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Button from 'primevue/button';
import ImportRecordDialog from '@/components/dialogs/ImportRecordDialog.vue';
import { useUIStore } from "@/stores/uiStore";
import { storeToRefs } from "pinia";

const UIStore = useUIStore();
const { isAddDialogOpen, isImportDialogOpen } = storeToRefs(UIStore)

const emit = defineEmits<{
    (e: 'request-add', form: any): void;
    (e: 'request-import', payload: { data: any[], overwrite: boolean, clearAll: boolean }): void;
    (e: 'request-export'): void;
}>();

const handleExport = () => {
    emit('request-export');
};

const handleImport = (payload: { data: any[], overwrite: boolean, clearAll: boolean }) => {
    emit('request-import', payload);
    isImportDialogOpen.value = false;
};
</script>

<style scoped>
.actions-container {
    display: flex;
    justify-content: flex-end; /* 桌面版靠右對齊 */
    align-items: center;
    gap: 1rem;
    padding: 0.5rem;
}
</style>