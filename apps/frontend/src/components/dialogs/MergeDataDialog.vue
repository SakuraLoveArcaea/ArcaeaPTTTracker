<template>
    <Dialog v-model:visible="visible" modal header="發現本機暫存資料" :style="{ width: '90vw', maxWidth: '450px' }" :closable="false">
        <div class="flex flex-col gap-3">
            <div class="flex items-center gap-3 text-blue-600 bg-blue-50 p-3 rounded-md">
                <i class="pi pi-cloud-upload text-2xl"></i>
                <span class="font-bold">您已成功登入！</span>
            </div>
            <p class="text-gray-700 leading-relaxed">
                系統偵測到您在未登入狀態下，有 <b>{{ recordCount }}</b> 筆保存在本機的成績紀錄。
            </p>
            <p class="text-gray-600 text-sm">
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

<style scoped>
</style>