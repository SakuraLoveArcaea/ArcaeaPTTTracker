<script setup lang="ts">
import Button from 'primevue/button'

const emit = defineEmits<{
    (e: 'save'): void
    (e: 'cancel'): void
}>()

const triggerSave = () => {
    const activeEl = document.activeElement as HTMLElement
    // 當編輯中的儲存格「失去焦點」時，PrimeVue 會自動觸發儲存
    if (activeEl && activeEl.tagName !== 'BODY') {
        activeEl.blur()
    }
    emit('save')
}

const triggerCancel = () => {
    const activeEl = document.activeElement as HTMLElement
    if (activeEl && activeEl.tagName !== 'BODY') {
        // 模擬按下 Escape 鍵，PrimeVue 會自動觸發取消
        activeEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }))
        activeEl.blur() // 確保完全退出編輯狀態
    }
    emit('cancel')
}
</script>

<template>
    <div class="editing-actions">
        <Button label="取消 (Esc)" severity="secondary" outlined @mousedown.prevent="triggerCancel" class="flex-1" />
        <Button label="儲存 (Enter)" severity="primary" @mousedown.prevent="triggerSave" class="flex-1" />
    </div>
</template>

<style scoped>
.editing-actions {
    width: 100%; /* 繼承父組件的寬度 */
    display: flex;
    gap: 0.5rem;
}
.editing-actions Button {
    flex: 1;
}
</style>