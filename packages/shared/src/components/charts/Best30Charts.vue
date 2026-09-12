<template>
    <div class="chart-wrapper-box">
        <!-- 自定義精美標題列 (點擊可開啟詳細統計 Dialog) -->
        <B30ChartHeader
            v-if="chartData.length > 0"
            :isMobileView="isMobileView"
            :showSongNamesOnX="showSongNamesOnX"
            :showSinglePttLine="showSinglePttLine"
            :modeName="strategy.name"
            @click-title="showStatsDialog = true"
            @toggle-xaxis="toggleXAxisMode"
        />

        <!-- 圖表主體 -->
        <div class="chart-container">
            <B30Highchart
                v-if="chartData.length > 0"
                :chartData="chartData"
                :chartHeight="chartHeight"
                :isMobileView="isMobileView"
                :isDarkTheme="isDarkTheme"
                :showMeanLine="showMeanLine"
                :showMedianLine="showMedianLine"
                :showSinglePttLine="showSinglePttLine"
                :showSongNamesOnX="showSongNamesOnX"
                :modeName="strategy.name"
                :stats="stats"
                @toggle-single-ptt="showSinglePttLine = !showSinglePttLine"
                @toggle-mean="showMeanLine = !showMeanLine"
                @toggle-median="showMedianLine = !showMedianLine"
            />

            <div v-else-if="recordsStore.isLoading" class="loading-overlay">
                <span>📊 資料載入中，請稍候...</span>
            </div>
            <div v-else class="loading-overlay">
                <span>📭 暫無 {{ strategy.name }} 成績數據</span>
            </div>
        </div>

        <!-- 手機版專用：圖表下方的詳細統計數據 -->
        <B30StatsCards
            v-if="chartData.length > 0 && isMobileView"
            :stats="stats"
            :modeName="strategy.name"
            size="small"
        />

        <!-- B30/B50 詳細統計對話框 -->
        <B30StatsDialog
            v-model:visible="showStatsDialog"
            :stats="stats"
            :modeName="strategy.name"
        />
    </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, nextTick } from 'vue';
import { useMediaQuery } from '@vueuse/core';
import { useRecordsStore } from "@tracker/shared/stores/recordsStore";
import { useUIStore } from "@tracker/shared/stores/uiStore";
import { storeToRefs } from "pinia";
import { type Record } from '@tracker/shared/utils/record';
import { getPttStrategy } from '@tracker/shared/utils/pttStrategy';

// 引入原子化/展示型子組件
import B30Highchart from './B30Highchart.vue';
import B30ChartHeader from './B30ChartHeader.vue';
import B30StatsCards from './B30StatsCards.vue';
import B30StatsDialog from './B30StatsDialog.vue';

const props = defineProps({
    records: {
        type: Array as () => Record[],
        default: null
    }
});

const recordsStore = useRecordsStore();
const UIStore = useUIStore();
const { records } = storeToRefs(recordsStore);
const { isDarkTheme } = storeToRefs(UIStore);

// 根據 pttMode 取得當前策略
const strategy = computed(() => getPttStrategy(UIStore.pttMode));

// 動態響應式高度與手機檢視管理
const isMobileView = computed(() => UIStore.isMobile);
const isTabletView = useMediaQuery('(max-width: 1024px)');

const chartHeight = computed(() => {
    return isMobileView.value ? 260 : (isTabletView.value ? 360 : 480);
});

// 輔助線與統計狀態
const showSinglePttLine = ref(true);
const showMeanLine = ref(true);
const showMedianLine = ref(false);
const showStatsDialog = ref(false);

// X 軸顯示歌名或排名切換狀態
const savedXAxisMode = localStorage.getItem('arcaea_chart_xaxis_show_names');
const showSongNamesOnX = ref(savedXAxisMode !== 'false');

const toggleXAxisMode = () => {
    showSongNamesOnX.value = !showSongNamesOnX.value;
    localStorage.setItem('arcaea_chart_xaxis_show_names', String(showSongNamesOnX.value));
};

const stats = computed(() => {
    if (chartData.value.length === 0) {
        return { mean: 0, median: 0, stdDev: 0, min: 0, max: 0 };
    }
    
    const values = chartData.value.map(item => item.y);
    const count = values.length;
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const sum = values.reduce((acc, val) => acc + val, 0);
    const mean = sum / count;
    
    // values 已在 chartData 內按 playPtt 降序排序，取 30 項的中位數
    const median = count >= 2 ? (values[Math.floor(count / 2) - 1] + values[Math.floor(count / 2)]) / 2 : values[0];
    
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / count;
    const stdDev = Math.sqrt(variance);
    
    return { mean, median, stdDev, min, max };
});

const handleJumpToRecord = (recordId: string) => {
    UIStore.jumpToRecord(recordId);
};

onMounted(() => {
    // 註冊全域 JS 函數提供給 Highcharts HTML Tooltip 調用
    // @ts-ignore
    window.jumpToRecord = (recordId: string) => {
        handleJumpToRecord(recordId);
    };
});

onUnmounted(() => {
    // @ts-ignore
    delete window.jumpToRecord;
});

// 優先使用外部傳入的 records (管理員端)，否則使用 store (玩家首頁)
const activeRecords = computed(() => {
    return props.records !== null ? props.records : records.value;
});

const chartData = computed(() => {
    if (!activeRecords.value || activeRecords.value.length === 0) return [];

    const strat = strategy.value;
    // 依據有效 PTT 降序排序，取前 topN 筆
    const sorted = [...activeRecords.value].sort(
        (a, b) => strat.effectivePtt(b) - strat.effectivePtt(a)
    );

    return sorted.slice(0, strat.topN).map((record, index) => {
        // 標準化 Arcaea 分數表達：如果是小數格式則乘以 10000 變成整數
        let scoreVal = record.score || 0;
        if (scoreVal <= 1005) {
            scoreVal = Math.round(scoreVal * 10000);
        } else {
            scoreVal = Math.round(scoreVal);
        }

        return {
            x: index,
            y: strat.effectivePtt(record),
            title: record.title || '未知',
            constant: record.constant || 0,
            score: scoreVal,
            difficulty: record.difficulty || 'FTR',
            id: record.id
        };
    });
});
</script>

<style scoped lang="scss">
.chart-wrapper-box {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
}

.chart-container {
    width: 100%;
}

.loading-overlay {
    font-size: 1.1rem;
    color: var(--text-muted);
    font-weight: bold;
    text-align: center;
    padding: 3rem;
}
</style>