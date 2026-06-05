<template>
    <Dialog v-model:visible="visible" modal :header="header" :style="{ width: '90vw', maxWidth: '400px' }" :closable="false">
        <div class="confirm-content">
            <i class="pi pi-exclamation-triangle severity-icon danger" v-if="severity === 'danger'"></i>
            <i class="pi pi-info-circle severity-icon info" v-else></i>
            <span class="confirm-message">{{ message }}</span>
        </div>
        <template #footer>
            <Button :label="cancelLabel" icon="pi pi-times" outlined severity="secondary" @click="onCancel" />
            <Button :label="acceptLabel" icon="pi pi-check" :severity="severity" @click="onAccept" autofocus />
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';

const visible = defineModel('visible', { type: Boolean, default: false });

const props = defineProps({
    header: { type: String, default: '確認' },
    message: { type: String, default: '您確定要執行此操作嗎？' },
    acceptLabel: { type: String, default: '確定' },
    cancelLabel: { type: String, default: '取消' },
    severity: { type: String, default: 'primary' } // 'primary', 'danger', etc.
});

const emit = defineEmits(['accept', 'cancel']);

const onAccept = () => {
    emit('accept');
    visible.value = false;
};

const onCancel = () => {
    emit('cancel');
    visible.value = false;
};
</script>

<style scoped lang="scss">
.confirm-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
}

.severity-icon {
  font-size: 2rem;
  flex-shrink: 0;
  
  &.danger {
    color: #ef4444;
  }
  &.info {
    color: #3b82f6;
  }
}

.confirm-message {
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--text-color);
}
</style>