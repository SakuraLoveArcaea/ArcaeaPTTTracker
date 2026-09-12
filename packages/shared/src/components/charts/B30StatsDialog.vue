<template>
    <Dialog
        v-model:visible="dialogVisible"
        :header="`${modeName} 詳細統計數據`"
        modal
        :draggable="false"
        :dismissableMask="true"
        class="stats-dialog"
        style="width: 90%; max-width: 400px;"
    >
        <B30StatsCards :stats="stats" :modeName="modeName" size="large" />
        <template #footer>
            <Button label="關閉" outlined severity="secondary" @click="dialogVisible = false" class="close-btn" />
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import B30StatsCards from './B30StatsCards.vue';

const props = defineProps({
    visible: {
        type: Boolean,
        required: true
    },
    stats: {
        type: Object as PropType<{
            mean: number;
            median: number;
            stdDev: number;
            min: number;
            max: number;
        }>,
        required: true
    },
    modeName: {
        type: String,
        default: 'B30'
    }
});

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
}>();

const dialogVisible = computed({
    get: () => props.visible,
    set: (val) => emit('update:visible', val)
});
</script>

<style scoped lang="scss">
/* Glassmorphic Dialog Styling */
:deep(.p-dialog) {
    background: var(--dialog-bg) !important;
    border: 1px solid var(--border-color) !important;
    border-radius: 16px !important;
    box-shadow: var(--card-shadow) !important;
    backdrop-filter: var(--glass-blur) !important;
    -webkit-backdrop-filter: var(--glass-blur) !important;

    .p-dialog-header {
        background: var(--dialog-header-bg) !important;
        border-bottom: 1px solid var(--border-color) !important;
        padding: 1.25rem 1.5rem !important;
        color: var(--text-color) !important;
        font-weight: 700 !important;
    }

    .p-dialog-content {
        background: transparent !important;
        padding: 1.5rem !important;
    }

    .p-dialog-footer {
        background: var(--dialog-header-bg) !important;
        border-top: 1px solid var(--border-color) !important;
        padding: 0.75rem 1.5rem !important;
    }
}

.close-btn {
    width: 100%;
}
</style>
