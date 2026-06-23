<template>
    <Dialog
        v-model:visible="visible"
        header="更新日誌"
        modal
        :style="{ width: '90vw', maxWidth: '600px' }"
        dismissableMask
    >
        <ChangelogPanel />
    </Dialog>
</template>

<script setup lang="ts">
import Dialog from 'primevue/dialog';
import ChangelogPanel from '@tracker/shared/components/dashboard/ChangelogPanel.vue';

const visible = defineModel<boolean>('visible', { default: false });
</script>
