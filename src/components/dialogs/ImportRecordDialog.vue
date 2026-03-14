<template>
    <Dialog v-model:visible="visible" modal header="匯入 JSON 紀錄" :style="{ width: '90vw', maxWidth: '600px' }">
        <div class="flex flex-col gap-4 mt-2">
            <div class="import-instructions">
                <p>請將您的成績資料以 <b>JSON 陣列</b> 的格式貼在下方。</p>
                <pre class="code-example">
[
  {
    "title": "Abstruse Dilemma",
    "difficulty": "FTR",
    "constant": 11.3,
    "score": 9939932
  }
]</pre>
            </div>
            <div class="options-container">
                <div class="font-bold text-gray-700 mb-2">匯入選項：</div>
                <div class="option-item">
                    <Checkbox v-model="overwrite" inputId="optOverwrite" :binary="true" :disabled="clearAll" />
                    <label for="optOverwrite" class="cursor-pointer" :class="{'opacity-50': clearAll}">若「標題 + 難度」相同，則覆蓋舊紀錄</label>
                </div>
                <div class="option-item mt-2">
                    <Checkbox v-model="clearAll" inputId="optClear" :binary="true" />
                    <label for="optClear" class="cursor-pointer font-bold" :class="{'text-red-500': clearAll}">⚠️ 匯入前清空您的所有紀錄</label>
                </div>
            </div>
            <Textarea v-model="jsonString" rows="8" placeholder="請在此貼上 JSON 陣列..." class="w-full font-mono text-sm mt-2" />
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

<style scoped>
.import-instructions { background-color: #f8fafc; padding: 1rem; border-radius: 6px; border-left: 4px solid #3b82f6; }
.code-example { background-color: #1e293b; color: #e2e8f0; padding: 0.75rem; border-radius: 4px; font-size: 0.8rem; margin-top: 0.5rem; overflow-x: auto; }
.options-container { background-color: #f1f5f9; padding: 1rem; border-radius: 6px; margin-top: 1rem; }
.option-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; }
.opacity-50 { opacity: 0.5; }
.text-red-500 { color: #ef4444; }
</style>