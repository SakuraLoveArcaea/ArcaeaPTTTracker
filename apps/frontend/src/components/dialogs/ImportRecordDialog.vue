<template>
    <Dialog v-model:visible="visible" modal header="匯入 JSON 紀錄" :style="{ width: '90vw', maxWidth: '600px' }">
        <div class="import-dialog-content">
            <div class="import-instructions">
                <p class="instruction-title">請將您的成績資料以 <b>JSON 陣列</b> 的格式貼在下方。</p>
                <pre class="code-example">{{ prompt }}</pre>
            </div>
            
            <div class="options-container">
                <div class="options-title">匯入選項：</div>
                <div class="option-item">
                    <Checkbox v-model="overwrite" inputId="optOverwrite" :binary="true" :disabled="clearAll" />
                    <label for="optOverwrite" class="option-label" :class="{'opacity-50': clearAll}">若「標題 + 難度」相同，則覆蓋舊紀錄</label>
                </div>
                <div class="option-item">
                    <Checkbox v-model="clearAll" inputId="optClear" :binary="true" />
                    <label for="optClear" class="option-label danger-label" :class="{'text-red-500': clearAll}">⚠️ 匯入前清空您的所有紀錄</label>
                </div>
            </div>
            
            <div class="textarea-wrapper">
                <Textarea v-model="jsonString" rows="8" placeholder="請在此貼上 JSON 陣列..." autofocus class="import-textarea" />
            </div>
        </div>
        <template #footer>
            <Button label="取消" icon="pi pi-times" outlined severity="secondary" @click="close" />
            <Button label="確認匯入" icon="pi pi-check" @click="processImport" :loading="isImporting" />
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Textarea from 'primevue/textarea';
import Checkbox from 'primevue/checkbox';
import { useToast } from "primevue/usetoast";

const visible = defineModel('visible', { type: Boolean, default: false });
const emit = defineEmits(['import']);
const toast = useToast();

const prompt = `[
  {
    "title": "Abstruse Dilemma",
    "difficulty": "FTR",
    "constant": 11.3,
    "score": 9939932
  }
]`

const jsonString = ref('');
const overwrite = ref(true);
const clearAll = ref(false);
const isImporting = ref(false);

watch(visible, (newVal) => {
    if (newVal) {
        jsonString.value = '';
        overwrite.value = true;
        clearAll.value = false;
        isImporting.value = false;
    }
});

const close = () => {
    visible.value = false;
};

const processImport = () => {
    if (!jsonString.value.trim()) {
        toast.add({ severity: 'warn', summary: '提示', detail: '請輸入 JSON 資料', life: 3000 });
        return;
    }

    try {
        let parsedData = JSON.parse(jsonString.value);
        if (!Array.isArray(parsedData)) {
            parsedData = [parsedData];
        }

        emit('import', {
            data: parsedData,
            overwrite: overwrite.value,
            clearAll: clearAll.value
        });
        
    } catch (err) {
        toast.add({ severity: 'error', summary: '解析失敗', detail: 'JSON 格式不正確，請檢查語法', life: 4000 });
    }
};
</script>

<style scoped lang="scss">
.import-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 0.5rem 0;
}

.import-instructions {
  background-color: var(--instruction-bg);
  border-left: 4px solid var(--instruction-border);
  padding: 1rem;
  border-radius: 6px;

  .instruction-title {
    font-size: 0.9rem;
    color: var(--text-color);
    margin: 0 0 0.5rem 0;
    
    b {
      color: #3b82f6;
    }
  }
}

.code-example {
  background-color: rgba(15, 23, 42, 0.4);
  border: 1px solid var(--border-color);
  color: var(--text-muted);
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.8rem;
  margin: 0;
  overflow-x: auto;
  font-family: 'Courier New', Courier, monospace;
}

.options-container {
  background-color: var(--options-bg);
  border: 1px solid var(--border-color);
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.options-title {
  font-weight: 700;
  color: var(--text-color);
  font-size: 0.9rem;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.option-label {
  font-size: 0.85rem;
  color: var(--text-muted);
  cursor: pointer;
  user-select: none;
  
  &.opacity-50 {
    opacity: 0.5;
  }
  
  &.danger-label {
    font-weight: 600;
  }
}

.text-red-500 {
  color: #ef4444 !important;
}

.textarea-wrapper {
  width: 100%;
}

.import-textarea {
  width: 100%;
  background: var(--input-bg) !important;
  border: 1px solid var(--input-border) !important;
  color: var(--text-color) !important;
  border-radius: 8px;
  padding: 0.75rem;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.85rem;
  box-sizing: border-box;

  &:focus {
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
  }
}

:root:not(.p-dark) {
  .code-example {
    background-color: #f1f5f9;
  }
}
</style>