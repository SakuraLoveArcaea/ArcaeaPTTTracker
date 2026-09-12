<template>
    <Dialog v-model:visible="visible" modal :dismissableMask="true" header="個人設定" :style="{ width: '90vw', maxWidth: '350px' }">
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
                    <i class="pi pi-calculator settings-icon"></i>手機快捷分數鍵盤
                </span>
                <ToggleSwitch
                    v-model="UIStore.useExperimentalScoreInput"
                    @change="onExperimentalChange"
                />
            </div>

            <!-- 實驗性分數 PTT 估算 -->
            <div class="settings-row">
                <span class="settings-label">
                    <i class="pi pi-chart-line settings-icon"></i>分數 PTT 估算
                    <span class="beta-badge">Beta</span>
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

            <!-- PTT 計算模式 -->
            <div class="settings-row">
                <span class="settings-label">
                    <i class="pi pi-calculator settings-icon"></i>PTT 計算模式
                </span>
                <SelectButton
                    v-model="UIStore.pttMode"
                    :options="pttModeOptions"
                    optionLabel="label"
                    optionValue="value"
                    @change="onPttModeChange"
                    :allowEmpty="false"
                    size="small"
                />
            </div>

            <div class="settings-divider"></div>

            <!-- 曲包瀏覽：顯示 PST, PRS -->
            <div class="settings-row">
                <span class="settings-label">
                    <i class="pi pi-eye settings-icon"></i>顯示 PST、PRS 難度
                </span>
                <ToggleSwitch
                    v-model="UIStore.showPstPrs"
                    @change="onShowPstPrsChange"
                />
            </div>

            <!-- 曲包瀏覽：顯示按鍵上方成績 -->
            <div class="settings-row">
                <span class="settings-label">
                    <i class="pi pi-percentage settings-icon"></i>按鍵上方顯示歷史成績
                </span>
                <ToggleSwitch
                    v-model="UIStore.showScoresAboveBadges"
                    @change="onShowScoresAboveBadgesChange"
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
import { useUIStore } from '@tracker/shared/stores/uiStore';

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

const onShowPstPrsChange = () => {
    localStorage.setItem('arcaea_explorer_show_pst_prs', String(UIStore.showPstPrs));
};

const onShowScoresAboveBadgesChange = () => {
    localStorage.setItem('arcaea_explorer_show_scores_above_badges', String(UIStore.showScoresAboveBadges));
};

const pttModeOptions = ref([
    { label: 'B30', value: 'b30' },
    { label: 'B50', value: 'b50' }
]);

const onPttModeChange = () => {
    localStorage.setItem('arcaea_ptt_mode', UIStore.pttMode);
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

.beta-badge {
  font-size: 0.65rem;
  font-weight: 700;
  color: #ffffff;
  background: #ef4444; /* 霓虹亮紅色 */
  padding: 1px 5px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  line-height: 1.2;
}

.start-point-select {
  width: 135px;
}

.settings-divider {
  border-top: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
  margin: 0.25rem 0;
}
</style>
