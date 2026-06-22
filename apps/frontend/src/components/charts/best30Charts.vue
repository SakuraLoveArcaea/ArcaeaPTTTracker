<template>
    <div class="chart-wrapper-box">
        <!-- 自定義精美標題列 (點擊可開啟詳細統計 Dialog) -->
        <div v-if="chartData.length > 0" class="chart-header-row">
            <div class="header-left-stats" @click="showStatsDialog = true" title="點擊查看詳細統計數據">
                <h4 class="chart-title">
                    你的 B30 趨勢
                    <i class="pi pi-info-circle info-icon"></i>
                </h4>
                <span class="chart-subtitle">點擊此處查看詳細統計數據（平均值、中位數、標準差）</span>
            </div>
            <div class="header-right-toggle">
                <Button 
                    :label="showSongNamesOnX ? '顯示排名' : '顯示歌名'" 
                    :icon="showSongNamesOnX ? 'pi pi-hashtag' : 'pi pi-align-left'"
                    size="small" 
                    outlined
                    severity="secondary"
                    @click="toggleXAxisMode"
                    class="toggle-xaxis-btn"
                />
            </div>
        </div>

        <div class="chart-container">
            <Chart v-slot="{ chart }" v-if="chartData.length > 0" :options="chartOptions"></Chart>

            <div v-else-if="recordsStore.isLoading" class="loading-overlay">
                <span>📊 資料載入中，請稍候...</span>
            </div>
            <div v-else class="loading-overlay">
                <span>📭 暫無 B30 成績數據</span>
            </div>
        </div>

        <!-- B30 詳細統計對話框 -->
        <Dialog
            v-model:visible="showStatsDialog"
            header="B30 詳細統計數據"
            modal
            :draggable="false"
            :dismissableMask="true"
            class="stats-dialog"
            style="width: 90%; max-width: 400px;"
        >
            <div class="stats-dialog-content">
                <div class="stat-detail-card">
                    <div class="stat-icon-wrapper mean-bg">
                        <i class="pi pi-chart-line"></i>
                    </div>
                    <div class="stat-info">
                        <span class="stat-label">B30 平均值</span>
                        <span class="stat-value text-gold">{{ stats.mean.toFixed(4) }}</span>
                    </div>
                </div>

                <div class="stat-detail-card">
                    <div class="stat-icon-wrapper median-bg">
                        <i class="pi pi-sliders-h"></i>
                    </div>
                    <div class="stat-info">
                        <span class="stat-label">B30 中位數</span>
                        <span class="stat-value text-emerald">{{ stats.median.toFixed(4) }}</span>
                    </div>
                </div>

                <div class="stat-detail-card">
                    <div class="stat-icon-wrapper std-bg">
                        <i class="pi pi-percentage"></i>
                    </div>
                    <div class="stat-info">
                        <span class="stat-label">標準差 (Std Dev)</span>
                        <span class="stat-value text-blue">{{ stats.stdDev.toFixed(4) }}</span>
                    </div>
                </div>

                <div class="stat-detail-card">
                    <div class="stat-icon-wrapper range-bg">
                        <i class="pi pi-arrows-h"></i>
                    </div>
                    <div class="stat-info">
                        <span class="stat-label">單曲 PTT 區間</span>
                        <span class="stat-value">{{ stats.min.toFixed(2) }} ~ {{ stats.max.toFixed(2) }}</span>
                    </div>
                </div>
            </div>
            <template #footer>
                <Button label="關閉" outlined severity="secondary" @click="showStatsDialog = false" class="close-btn" />
            </template>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, nextTick } from 'vue';
import { Chart } from 'highcharts-vue';
import { useRecordsStore } from "@/stores/recordsStore";
import { useUIStore } from "@/stores/uiStore";
import { storeToRefs } from "pinia";
import { type Record } from '@/utils/record';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';

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
const chartHeight = ref(window.innerWidth < 768 ? 260 : (window.innerWidth < 1025 ? 360 : 480));
const isMobileView = ref(window.innerWidth < 768);

// 輔助線與統計狀態
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

const handleResize = () => {
    chartHeight.value = window.innerWidth < 768 ? 260 : (window.innerWidth < 1025 ? 360 : 480);
    isMobileView.value = window.innerWidth < 768;
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
    // 1. 切換分頁到表格
    UIStore.activeTab = 'table';
    
    // 2. 設定展開與選中高亮狀態
    UIStore.expandedRecordId = recordId;
    UIStore.highlightedRecordId = recordId;
    
    // 3. 等待 DOM 渲染完畢後，執行平滑滾動
    nextTick(() => {
        const scrollAndFocus = () => {
            const cardEl = document.getElementById(`record-card-${recordId}`);
            if (cardEl) {
                cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return true;
            }
            return false;
        };
        
        // 延遲重試以防 Tabs 切換動畫尚未完成導致 DOM 尚未完全渲染
        if (!scrollAndFocus()) {
            setTimeout(scrollAndFocus, 100);
            setTimeout(scrollAndFocus, 300);
        }
    });
    
    // 4. 2秒後移除高亮效果，觸發動畫漸變復原
    setTimeout(() => {
        if (UIStore.highlightedRecordId === recordId) {
            UIStore.highlightedRecordId = null;
        }
    }, 2000);
};

onMounted(() => {
    window.addEventListener('resize', handleResize);
    // 註冊全域 JS 函數提供給 Highcharts HTML Tooltip 調用
    // @ts-ignore
    window.jumpToRecord = (recordId: string) => {
        handleJumpToRecord(recordId);
    };
});

onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    // @ts-ignore
    delete window.jumpToRecord;
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
            difficulty: record.difficulty || 'FTR',
            id: record.id
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

    // 動態建置 Y 軸輔助線 (平均值與中位數)
    const plotLines: any[] = [];
    if (showMeanLine.value && chartData.value.length > 0) {
        plotLines.push({
            value: stats.value.mean,
            color: '#f59e0b', // 黃金色輔助線
            width: 2,
            dashStyle: 'Dash',
            zIndex: 4,
            label: {
                text: `B30 平均: ${stats.value.mean.toFixed(4)}`,
                align: 'right',
                x: -10,
                style: {
                    color: '#f59e0b',
                    fontWeight: 'bold',
                    fontSize: '11px',
                    textOutline: isDarkTheme.value ? '1px #000' : '1px #fff'
                }
            }
        });
    }
    if (showMedianLine.value && chartData.value.length > 0) {
        plotLines.push({
            value: stats.value.median,
            color: '#10b981', // 翡翠綠輔助線
            width: 2,
            dashStyle: 'ShortDot',
            zIndex: 4,
            label: {
                text: `中位數: ${stats.value.median.toFixed(4)}`,
                align: 'right',
                x: -10,
                style: {
                    color: '#10b981',
                    fontWeight: 'bold',
                    fontSize: '11px',
                    textOutline: isDarkTheme.value ? '1px #000' : '1px #fff'
                }
            }
        });
    }

    return {
        chart: {
            type: 'line',
            height: chartHeight.value,
            backgroundColor: 'transparent',
            spacingBottom: isMobileView.value ? 5 : 15,
            spacingLeft: isMobileView.value ? 5 : 10,
            spacingRight: isMobileView.value ? 5 : 10,
            spacingTop: isMobileView.value ? 5 : 15,
            events: {
                click: function () {
                    // 手機端點擊空白處隱藏 Tooltip
                    if (this.tooltip) {
                        this.tooltip.hide();
                    }
                }
            }
        },
        title: {
            text: null
        },
        subtitle: {
            text: null
        },
        xAxis: {
            title: { 
                text: isMobileView.value ? null : (showSongNamesOnX.value ? '歌曲' : '排名'),
                style: { color: textColor }
            },
            categories: showSongNamesOnX.value 
                ? chartData.value.map(item => item.title)
                : chartData.value.map((_, idx) => `#${idx + 1}`),
            crosshair: true,
            labels: {
                enabled: isMobileView.value ? !showSongNamesOnX.value : true, // 手機端若是排名模式則顯示橫軸標籤
                rotation: showSongNamesOnX.value ? -90 : 0, // 顯示排名時橫向易讀，不需旋轉
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
            gridLineColor: gridLineColor,
            plotLines: plotLines
        },
        legend: {
            enabled: true,
            itemStyle: {
                color: textColor,
                fontSize: '11px',
                fontFamily: 'inherit'
            },
            itemHoverStyle: {
                color: '#3b82f6'
            }
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
            {
                name: '平均值',
                color: '#f59e0b',
                visible: showMeanLine.value,
                data: [],
                dashStyle: 'Dash',
                marker: { enabled: false },
                events: {
                    legendItemClick: function () {
                        showMeanLine.value = !showMeanLine.value;
                        return false;
                    }
                }
            },
            {
                name: '中位數',
                color: '#10b981',
                visible: showMedianLine.value,
                data: [],
                dashStyle: 'ShortDot',
                marker: { enabled: false },
                events: {
                    legendItemClick: function () {
                        showMedianLine.value = !showMedianLine.value;
                        return false;
                    }
                }
            }
        ],
        credits: {
            enabled: false,
        },
    };
});
</script>

<style scoped lang="scss">
.chart-wrapper-box {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
}

.chart-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0.75rem;
    user-select: none;
    gap: 1rem;
}

.header-left-stats {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    cursor: pointer;
    border-radius: 8px;
    transition: background-color 0.2s, transform 0.2s;
    padding: 0.25rem 0.5rem;
    flex: 1;
    min-width: 0;

    &:hover {
        background: var(--options-bg);
        transform: translateY(-1px);
        
        .chart-title {
            color: var(--primary);
            .info-icon {
                color: var(--primary);
                transform: scale(1.1);
            }
        }
    }
    
    &:active {
        transform: translateY(0);
    }
}

.header-right-toggle {
    display: flex;
    align-items: center;
}

.toggle-xaxis-btn {
    font-weight: 600 !important;
    font-size: 0.75rem !important;
}

.chart-title {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--text-color);
    margin: 0;
    transition: color 0.2s;

    .info-icon {
        font-size: 0.95rem;
        color: var(--text-muted);
        transition: all 0.2s;
    }
}

.chart-subtitle {
    font-size: 0.75rem;
    color: var(--text-muted);
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

/* Glassmorphic Dialog Styling */
:deep(.p-dialog) {
    background: var(--dialog-bg) !important;
    border: 1px solid var(--border-color) !important;
    border-radius: 16px !important;
    box-shadow: var(--card-shadow) !important;
    backdrop-filter: var(--glass-blur) !important;
    -webkit-backdrop-filter: var(--glass-blur) !important;

    .p-dialog-header {
        background: var(--dialog-header-bg) !important;
        border-bottom: 1px solid var(--border-color) !important;
        padding: 1.25rem 1.5rem !important;
        color: var(--text-color) !important;
        font-weight: 700 !important;
    }

    .p-dialog-content {
        background: transparent !important;
        padding: 1.5rem !important;
    }

    .p-dialog-footer {
        background: var(--dialog-header-bg) !important;
        border-top: 1px solid var(--border-color) !important;
        padding: 0.75rem 1.5rem !important;
    }
}

.stats-dialog-content {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.stat-detail-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1rem;
    background: var(--options-bg);
    border: 1px solid var(--border-color);
    border-radius: 10px;
}

.stat-icon-wrapper {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    
    &.mean-bg {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
    }
    &.median-bg {
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
    }
    &.std-bg {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
    }
    &.range-bg {
        background: rgba(100, 116, 139, 0.1);
        color: var(--text-muted);
    }
}

.stat-info {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
}

.stat-label {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 500;
}

.stat-value {
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--text-color);
    font-family: 'Courier New', Courier, monospace;

    &.text-gold {
        color: #f59e0b;
    }
    &.text-emerald {
        color: #10b981;
    }
    &.text-blue {
        color: #3b82f6;
    }
}

.close-btn {
    width: 100%;
}
</style>