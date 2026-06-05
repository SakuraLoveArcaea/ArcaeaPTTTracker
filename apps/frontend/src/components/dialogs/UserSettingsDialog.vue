<template>
    <Dialog v-model:visible="visible" modal header="個人設定" :style="{ width: '90vw', maxWidth: '350px' }">
        <div class="settings-container-dialog">
            <!-- 顯示主題 -->
            <div class="settings-row">
                <span class="settings-label">
                    <i class="pi pi-palette settings-icon"></i>顯示主題
                </span>
                <SelectButton
                    v-model="themeModel"
                    :options="themeOptions"
                    optionLabel="label"
                    optionValue="value"
                    @change="onThemeChange"
                    :allowEmpty="false"
                    size="small"
                />
            </div>
            
            <!-- 實驗性手機分數鍵盤 -->
            <div class="settings-row">
                <span class="settings-label">
                    <i class="pi pi-flask settings-icon"></i>實驗性手機分數鍵盤
                </span>
                <ToggleSwitch
                    v-model="UIStore.useExperimentalScoreInput"
                    @change="onExperimentalChange"
                />
            </div>
        </div>
        <template #footer>
            <Button label="關閉" outlined severity="secondary" @click="visible = false" />
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import SelectButton from 'primevue/selectbutton';
import ToggleSwitch from 'primevue/toggleswitch';
import Button from 'primevue/button';
import { useUIStore } from '@/stores/uiStore';

const visible = defineModel<boolean>('visible', { default: false });
const UIStore = useUIStore();

const themeModel = ref(UIStore.isDarkTheme ? 'dark' : 'light');
const themeOptions = ref([
    { label: '日間', value: 'light' },
    { label: '夜間', value: 'dark' }
]);

const onThemeChange = (e: any) => {
    if (e.value && (e.value === 'dark') !== UIStore.isDarkTheme) {
        UIStore.toggleTheme();
    }
};

const onExperimentalChange = () => {
    localStorage.setItem('arcaea_experimental_score_input', String(UIStore.useExperimentalScoreInput));
};

// 監聽 UIStore 的主題變更（以防在其他地方切換）
watch(() => UIStore.isDarkTheme, (newVal) => {
    themeModel.value = newVal ? 'dark' : 'light';
});
</script>

<style scoped lang="scss">
.settings-container-dialog {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.5rem 0;
}

.settings-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  width: 100%;
}

.settings-label {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-color);

  .settings-icon {
    color: #3b82f6;
    font-size: 1.05rem;
  }
}
</style>
