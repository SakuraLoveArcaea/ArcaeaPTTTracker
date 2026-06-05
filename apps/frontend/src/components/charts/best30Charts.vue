<template>
    <div class="chart-container">
        <Chart v-if="chartData.length > 0" :options="chartOptions"></Chart>

        <div v-else-if="recordsStore.isLoading" class="loading-overlay">
            <span>📊 資料載入中，請稍候...</span>
        </div>
        <div v-else class="loading-overlay">
            <span>📭 暫無 B30 成績數據</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { Chart } from 'highcharts-vue';
import { useRecordsStore } from "@/stores/recordsStore";
import { useUIStore } from "@/stores/uiStore";
import { storeToRefs } from "pinia";
import { type Record } from '@/utils/record';

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

// 動態響應式高度與手機檢視管理
const chartHeight = ref(window.innerWidth < 1025 ? 380 : 480);
const isMobileView = ref(window.innerWidth < 768);

const handleResize = () => {
    chartHeight.value = window.innerWidth < 1025 ? 380 : 480;
    isMobileView.value = window.innerWidth < 768;
};

onMounted(() => {
    window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
});

// 優先使用外部傳入的 records (管理員端)，否則使用 store (玩家首頁)
const activeRecords = computed(() => {
    return props.records !== null ? props.records : records.value;
});

const chartData = computed(() => {
    if (!activeRecords.value || activeRecords.value.length === 0) return [];

    // 依據 playPtt 降序排序，取前 30 筆
    const sorted = [...activeRecords.value].sort((a, b) => b.playPtt - a.playPtt);

    return sorted.slice(0, 30).map((record) => {
        // 標準化 Arcaea 分數表達：如果是小數格式則乘以 10000 變成整數
        let scoreVal = record.score || 0;
        if (scoreVal <= 1005) {
            scoreVal = Math.round(scoreVal * 10000);
        } else {
            scoreVal = Math.round(scoreVal);
        }

        return {
            y: record.playPtt,
            title: record.title || '未知',
            constant: record.constant || 0,
            score: scoreVal,
            difficulty: record.difficulty || 'FTR'
        };
    });
});

const yAxisMin = computed(() => {
    if (chartData.value.length === 0) return null;
    return Math.min(...chartData.value.map(item => item.y));
});

const yAxisMax = computed(() => {
    if (chartData.value.length === 0) return null;
    return Math.max(...chartData.value.map(item => item.y));
});

const chartOptions = computed(() => {
    const textColor = isDarkTheme.value ? '#cbd5e1' : '#1e293b';
    const gridLineColor = isDarkTheme.value ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.05)';

    return {
        chart: {
            type: 'line',
            height: chartHeight.value,
            backgroundColor: 'transparent',
            spacingBottom: isMobileView.value ? 10 : 15,
            spacingLeft: isMobileView.value ? 5 : 10,
            spacingRight: isMobileView.value ? 5 : 10,
            spacingTop: isMobileView.value ? 10 : 15
        },
        title: {
            text: '你的B30趨勢',
            style: {
                color: textColor,
                fontWeight: 'bold',
                fontFamily: 'inherit'
            }
        },
        xAxis: {
            title: { 
                text: isMobileView.value ? '排名' : '歌曲',
                style: { color: textColor }
            },
            // 手機版使用排名作為橫軸類別，避免歌名過長重疊擠壓；電腦版仍顯示歌名
            categories: isMobileView.value 
                ? chartData.value.map((_, idx) => `#${idx + 1}`) 
                : chartData.value.map(item => item.title),
            crosshair: true,
            labels: {
                rotation: isMobileView.value ? 0 : -90, // 手機版不旋轉，保持水平易讀
                step: isMobileView.value ? 3 : 1, // 手機版每隔 3 個顯示一個刻度，避免擁擠
                style: {
                    color: textColor,
                    fontSize: '10px'
                }
            },
            tickColor: gridLineColor
        },
        yAxis: {
            min: yAxisMin.value,
            max: yAxisMax.value,
            title: { 
                text: '單曲 PTT',
                style: { color: textColor }
            },
            labels: {
                style: { color: textColor },
                formatter: function () {
                    return this.value.toLocaleString('zh-TW', { maximumFractionDigits: 2 });
                },
            },
            crosshair: true,
            gridLineColor: gridLineColor
        },
        tooltip: {
            shared: true,
            useHTML: true,
            backgroundColor: isDarkTheme.value ? '#1e293b' : '#ffffff',
            borderColor: isDarkTheme.value ? '#334155' : '#cbd5e1',
            style: {
                color: isDarkTheme.value ? '#f8fafc' : '#0f172a',
                fontSize: '13px'
            },
            formatter: function () {
                const point = this.points[0].point;
                const exactValue = point.y.toLocaleString('zh-TW', { maximumFractionDigits: 4 });
                const formattedScore = point.score.toLocaleString('zh-TW');

                return `
                    <div style="padding: 4px;">
                        <b>#${point.index + 1} - ${point.title}</b><br/>
                        <hr style="margin: 4px 0; border-top: 1px dashed ${isDarkTheme.value ? '#475569' : '#ccc'};"/>
                        難度：<b>${point.difficulty}</b><br/>
                        定數：<b>${point.constant.toFixed(1)}</b><br/>
                        分數：<b>${formattedScore}</b><br/>
                        <span style="color:${this.points[0].color}">\u25CF</span>
                        單曲 PTT：<b>${exactValue}</b>
                    </div>
                `;
            },
        },
        series: [
            {
                name: '單曲 PTT',
                data: chartData.value,
                color: '#3b82f6',
                marker: {
                    enabled: true,
                    radius: isMobileView.value ? 3 : 4
                },
            },
        ],
        credits: {
            enabled: false,
        },
    };
});
</script>

<style scoped>
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