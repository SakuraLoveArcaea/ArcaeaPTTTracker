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

            <!-- 實驗性分數 PTT 估算 -->
            <div class="settings-row">
                <span class="settings-label">
                    <i class="pi pi-chart-line settings-icon"></i>實驗性分數 PTT 估算
                </span>
                <ToggleSwitch
                    v-model="UIStore.useExperimentalPttEstimation"
                    @change="onPttEstimationChange"
                />
            </div>

            <!-- 圖表橫軸起點設定 -->
            <div v-if="UIStore.useExperimentalPttEstimation" class="settings-row">
                <span class="settings-label">
                    <i class="pi pi-sliders-h settings-icon"></i>估算圖表起點
                </span>
                <Select
                    v-model="UIStore.pttEstimationStartPoint"
                    :options="startPointOptions"
                    optionLabel="label"
                    optionValue="value"
                    @change="onStartPointChange"
                    size="small"
                    class="start-point-select"
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
import Select from 'primevue/select';
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

const onPttEstimationChange = () => {
    localStorage.setItem('arcaea_experimental_ptt_estimation', String(UIStore.useExperimentalPttEstimation));
};

const startPointOptions = ref([
    { label: '950 萬 (AA)', value: '9500000' },
    { label: '980 萬 (EX)', value: '9800000' }
]);

const onStartPointChange = () => {
    localStorage.setItem('arcaea_ptt_estimation_start_point', UIStore.pttEstimationStartPoint);
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

.start-point-select {
  width: 135px;
}
</style>
