<template>
    <div class="demo-page">
        <header class="demo-header">
            <h1>RecordsTable 新穎度視覺化演示</h1>
            <p>即時調整色彩與時間公式，觀察 Table 內曲名左側的顏色褪色效果與對應的對數時間區間文字。</p>
        </header>

        <div class="demo-content">
            <aside class="demo-controls">
                <h2>色彩與數學變數</h2>

                <div class="control-group">
                    <div class="label-row">
                        <label class="control-label">對數底數 (Log Base)</label>
                        <InputNumber v-model="settings.logBase" :min="1.1" :step="0.1" :minFractionDigits="1" :maxFractionDigits="1" fluid class="fixed-width-input" />
                    </div>
                    <Slider v-model="settings.logBase" :min="1.1" :max="5" :step="0.1" fluid />
                    <small class="control-help">控制時間跨度（底數）。預設 2 為倍數成長。調整時可觀察右側文字區間的自動變化。</small>
                </div>

                <div class="control-group">
                    <div class="label-row">
                        <label class="control-label">色相 (Hue)</label>
                        <InputNumber v-model="settings.baseHue" :min="0" :max="360" :step="1" fluid class="fixed-width-input" />
                    </div>
                    <Slider v-model="settings.baseHue" :min="0" :max="360" :step="1" fluid class="hue-slider-bar" />
                    <div class="hue-preview-bar" :style="{ backgroundColor: `hsl(${settings.baseHue}, 80%, 60%)` }"></div>
                    <small class="control-help">0:紅, 35:橘, 142:綠, 210:藍, 275:紫</small>
                </div>

                <div class="control-group">
                    <div class="label-row">
                        <label class="control-label">視覺層級總數 (Max Levels)</label>
                        <InputNumber v-model="settings.maxLevels" :min="3" :max="15" :step="1" fluid class="fixed-width-input" />
                    </div>
                    <Slider v-model="settings.maxLevels" :min="3" :max="15" :step="1" fluid />
                    <small class="control-help">決定總共有幾層。增加時，右側會自動生成對應層級的假資料。</small>
                </div>

                <div class="control-reset-row">
                    <Button label="重置為預設" icon="pi pi-refresh" outlined severity="secondary" @click="resetToDefault" fluid />
                </div>
            </aside>

            <main class="demo-visualization">
                <RecordsTable
                    :records="mockRecords"
                    :is-loading="false"
                    :setting="settings"
                    @request-update="handleMockUpdate"
                    @request-delete="handleMockDelete"
                />
            </main>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import InputNumber from 'primevue/inputnumber';
import Slider from 'primevue/slider';
import Button from 'primevue/button';
// 請確認路徑是否符合你的專案結構
import RecordsTable from '../components/table/recordTable/RecordsTable.vue';
import { Difficulty, type Record } from '../utils/record';

const settings = ref({
    logBase: 2,
    baseHue: 142,
    maxLevels: 7
});

const mockRecords = ref<Record[]>([]);

const resetToDefault = () => {
    settings.value = { logBase: 2, baseHue: 142, maxLevels: 7 };
};

// ==========================================
// 核心：根據 Level 自動推算人類可讀的時間區間字串
// ==========================================
const getLevelTimeText = (level: number, logBase: number, maxLevels: number) => {
    // 基數改為 30 分鐘 (0.020833 天)
    const unitInDays = 0.25 / 24;
    const minDays = Math.pow(logBase, level) * unitInDays;
    const maxDays = Math.pow(logBase, level + 1) * unitInDays;

    const format = (d: number) => {
        const totalMinutes = d * 24 * 60;
        if (totalMinutes < 60) return `${Math.floor(totalMinutes)} 分鐘`;
        if (d < 1) return `${Math.floor(totalMinutes / 60)} 小時`;
        if (d < 30) return `${Math.floor(d)} 天`;
        return `${Math.floor(d / 30)} 個月`;
    };

    if (level === 0) return `${format(maxDays)}內`;
    if (level === maxLevels - 1) return `${format(minDays)}以上`;
    return `${format(minDays)} ~ ${format(maxDays)}前`;
};

// ==========================================
// 監聽變數改變，自動生成對應層數的 mock 資料
// ==========================================
watch(settings, (newSettings) => {
    const { logBase, baseHue, maxLevels } = newSettings;
    const now = Date.now();
    const DAY_MS = 1000 * 60 * 60 * 24;


    const newData: Record[] = [];


    // 精準生成 Level 0 到 Level (maxLevels - 1) 的資料
    for (let level = 0; level < maxLevels; level++) {
        // 反推這個 level 的時間區間
        const minDays = Math.pow(logBase, level);
        const maxDays = Math.pow(logBase, level + 1);

        // 修正 daysAgo 生成邏輯：
        // 抓取該區間內靠前面的時間點 (0.3) 來產生 daysAgo，確保計算結果一定會落在這個 level
        const daysAgo = level === 0 ? 0.5 : minDays + (maxDays - minDays) * 0.3;

        // 自動呼叫文字產生器
        const autoTimeText = getLevelTimeText(level, logBase, maxLevels);

        newData.push({
            id: `mock_${level}`,
            // 標題直接加上自動換算好的時間區間！
            title: `${autoTimeText}`,
            difficulty: 'FTR' as Difficulty,
            constant: 10.0,
            score: 990,
            playPtt: 11.0,
            lastUpdate: now - (daysAgo * DAY_MS), // 產生真實的時間戳餵給 Table
            autoUpdate: true
        });
    }

    mockRecords.value = newData;
}, { deep: true, immediate: true }); // immediate: true 確保一載入就執行第一次生成

const handleMockUpdate = (payload: any) => { payload.onSuccess(); };
const handleMockDelete = (record: Record) => { mockRecords.value = mockRecords.value.filter(r => r.id !== record.id); };
</script>

<style scoped>
/* 佈局與整體樣式 */
.demo-page {
    padding: 2rem;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background-color: #fcfcfc;
    color: #333;
}

.demo-header {
    text-align: center;
    margin-bottom: 2rem;
}

.demo-header h1 {
    font-size: 2.2rem;
    font-weight: bold;
    color: #1a1a1a;
}

.demo-header p {
    color: #666;
    margin-top: 0.5rem;
}

.demo-content {
    display: flex;
    gap: 2rem;
    align-items: flex-start;
}

/* 1. 左側控制面板樣式 - 調整 Slider 為長條狀 */
.demo-controls {
    flex: 0 0 320px; /* 稍微撐寬一點，給 Slider 空間 */
    background-color: #ffffff;
    padding: 1.5rem;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.demo-controls h2 {
    font-size: 1.25rem;
    font-weight: bold;
    margin-bottom: 1.5rem;
}

.control-group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem; /* 增加內部間距 */
    margin-bottom: 1.75rem; /* 增加組與組之間的間距 */
}

.label-row {
    display: flex;
    justify-content: space-between; /* 標題靠左，數字靠右 */
    align-items: center;
}

.control-label {
    font-weight: bold;
    color: #4b5563; /* gray-600 */
}

.fixed-width-input {
    width: 80px; /* 固定輸入框寬度 */
}

.control-help {
    color: #6b7280; /* gray-500 */
    font-size: 0.8rem;
    line-height: 1.4;
    margin-top: -0.25rem; /* 讓幫助文字靠近 Slider */
}

/* Hue Slider 的漸層背景 */
.hue-slider-bar {
    background: linear-gradient(
        to right,
        hsl(0, 80%, 60%),
        hsl(60, 80%, 60%),
        hsl(120, 80%, 60%),
        hsl(180, 80%, 60%),
        hsl(240, 80%, 60%),
        hsl(300, 80%, 60%),
        hsl(360, 80%, 60%)
    );
    border-radius: 9999px; /* 使 Slider 本身有圓角 */
}

.hue-preview-bar {
    height: 10px;
    width: 100%;
    border-radius: 5px;
    border: 1px solid #e5e7eb;
    transition: background-color 0.2s;
}

.control-reset-row {
    margin-top: 2.5rem;
}

/* 2. 右側 Table 區域 */
.demo-visualization {
    flex: 1;
    background-color: #ffffff;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    padding: 1rem;
    min-width: 600px;
}

/* RWD: 螢幕太小時變成上下排 */
@media (max-width: 1024px) {
    .demo-content {
        flex-direction: column;
    }
    .demo-controls, .demo-visualization {
        width: 100%;
        flex: auto;
        min-width: auto;
    }
}
</style>