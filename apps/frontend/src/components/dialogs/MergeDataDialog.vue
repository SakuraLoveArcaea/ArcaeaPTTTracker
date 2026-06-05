<template>
    <Dialog v-model:visible="visible" modal header="發現本機暫存資料" :style="{ width: '90vw', maxWidth: '450px' }" :closable="false">
        <div class="merge-dialog-content">
            <div class="merge-alert-banner">
                <i class="pi pi-cloud-upload upload-icon"></i>
                <span class="banner-title">您已成功登入！</span>
            </div>
            <p class="description">
                系統偵測到您在未登入狀態下，有 <b>{{ recordCount }}</b> 筆保存在本機的成績紀錄。
            </p>
            <p class="sub-description">
                請問您想要將這些本機資料合併到您的雲端帳號，還是直接捨棄它們？
            </p>
        </div>
        <template #footer>
            <Button label="捨棄本機資料" icon="pi pi-trash" outlined severity="danger" @click="onDiscard" />
            <Button label="合併至雲端" icon="pi pi-check" severity="primary" @click="onMerge" autofocus />
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';

const visible = defineModel('visible', { type: Boolean, default: false });

const props = defineProps({
    recordCount: { type: Number, default: 0 }
});

const emit = defineEmits(['merge', 'discard']);

const onMerge = () => {
    emit('merge');
    visible.value = false;
};

const onDiscard = () => {
    emit('discard');
    visible.value = false;
};
</script>

<style scoped lang="scss">
.merge-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.5rem 0;
}

.merge-alert-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 8px;
  color: #10b981;

  .upload-icon {
    font-size: 1.35rem;
  }

  .banner-title {
    font-weight: 700;
    font-size: 0.95rem;
  }
}

.description {
  font-size: 0.95rem;
  color: var(--text-color);
  line-height: 1.6;
  margin: 0;

  b {
    color: #3b82f6;
  }
}

.sub-description {
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.5;
  margin: 0;
}
</style>