<template>
    <div class="inline-ptt-chart-container" :class="{ 'mini-container': mini }">
        <!-- 顯示分數和單曲 PTT 的標題區塊 -->
        <div class="chart-header-info" :class="{ 'mini-header': mini }">
            <div class="info-item">
                <span class="info-label">{{ isPreviewing ? '預估分數' : '當前分數' }}</span>
                <span class="info-value font-monospace" :class="isPreviewing ? 'text-preview' : 'text-actual'">
                    {{ selectedScore.toLocaleString('zh-TW') }}
                </span>
            </div>
            <div class="info-item">
                <span class="info-label">{{ isPreviewing ? '預估 PTT' : '當前 PTT' }}</span>
                <span class="info-value font-monospace" :class="isPreviewing ? 'text-preview-ptt' : 'text-actual-ptt'">
                    {{ selectedPlayPtt.toFixed(4) }}
                </span>
            </div>
        </div>

        <!-- Highcharts 折線圖 -->
        <div 
            class="chart-container-inline" 
            :style="mini ? { height: '100px' } : {}"
            @touchend="handleTouchEnd"
            @touchcancel="handleTouchEnd"
            @mouseleave="handleTouchEnd"
        >
            <Chart :options="chartOptions" ref="highchartsRef" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { Chart } from 'highcharts-vue';
import { type Record } from '@/utils/record';
import { calculatePlayPtt } from '@/utils/arcaeaRule';
import { useUIStore } from '@/stores/uiStore';
import { storeToRefs } from 'pinia';

const highchartsRef = ref<any>(null);
let updateTimeoutId: any = null;
const isInteracting = ref(false);

const handleTouchEnd = () => {
    isInteracting.value = false;
    initScore();
};

const props = defineProps({
    record: {
        type: Object as () => Record,
        required: true
    },
    mini: {
        type: Boolean,
        default: false
    }
});

const UIStore = useUIStore();
const { isDarkTheme } = storeToRefs(UIStore);

const currentScoreValue = computed(() => {
    const rawScore = props.record.score || 0;
    const fullScore = rawScore > 1005 ? rawScore : rawScore * 10000;
    return Math.round(fullScore);
});

// 動態計算最低分數點 (X軸起點)，可由設定選擇
const minScore = computed(() => {
    const constant = props.record.constant || 0;
    // 0 PTT 的絕對最低分數
    const dynamicMin = Math.max(0, Math.floor(9500000 - constant * 300000));
    
    let preferredStart = dynamicMin;
    const configStart = UIStore.pttEstimationStartPoint;
    if (configStart === '9500000') {
        preferredStart = 9500000;
    } else if (configStart === '9800000') {
        preferredStart = 9800000;
    }
    
    // 不再動態延伸包含低於起點的分數，直接使用設定的起點（大於 0 PTT 的分數）
    return Math.max(dynamicMin, preferredStart);
});

// 當前選取分數，預設為該 record 目前的分數 (轉成 7 位整數形式)
const selectedScore = ref(10000000);

const selectedPlayPtt = computed(() => {
    return calculatePlayPtt(props.record.constant, selectedScore.value);
});

const isPreviewing = computed(() => {
    return selectedScore.value !== currentScoreValue.value;
});

const initScore = () => {
    if (updateTimeoutId) {
        clearTimeout(updateTimeoutId);
        updateTimeoutId = null;
    }
    if (props.record) {
        const rawScore = props.record.score || 0;
        const fullScore = rawScore > 1005 ? rawScore : rawScore * 10000;
        selectedScore.value = Math.max(minScore.value, Math.round(fullScore));
    }
    if (highchartsRef.value && highchartsRef.value.chart) {
        highchartsRef.value.chart.pointer.reset();
    }
};

// 監聽 X 軸起點變動以防滑塊溢出
watch(minScore, (newMin) => {
    if (selectedScore.value < newMin) {
        selectedScore.value = newMin;
    }
});

const updatePlotLine = (value: number) => {
    if (highchartsRef.value && highchartsRef.value.chart) {
        const chart = highchartsRef.value.chart;
        const xAxis = chart.xAxis[0];
        xAxis.removePlotLine('selected-score-line');
        
        // 如果實際分數低於圖表起點，且使用者目前沒有進行觸碰互動，就不顯示藍線
        if (currentScoreValue.value < minScore.value && !isInteracting.value) {
            return;
        }

        xAxis.addPlotLine({
            id: 'selected-score-line',
            value: value,
            color: '#3b82f6',
            width: 2,
            dashStyle: 'Solid',
            zIndex: 5
        });
    }
};

const updateActualScorePlotLine = () => {
    if (highchartsRef.value && highchartsRef.value.chart) {
        const chart = highchartsRef.value.chart;
        const xAxis = chart.xAxis[0];
        xAxis.removePlotLine('actual-score-line');
        xAxis.addPlotLine({
            id: 'actual-score-line',
            value: currentScoreValue.value,
            color: isDarkTheme.value ? 'rgba(239, 68, 68, 0.5)' : 'rgba(239, 68, 68, 0.6)', // 霓虹紅色虛線
            width: 1.5,
            dashStyle: 'Dash',
            zIndex: 3
        });
    }
};

watch(selectedScore, (newVal) => {
    updatePlotLine(newVal);
});

watch([currentScoreValue, minScore], () => {
    updateActualScorePlotLine();
});

watch(isDarkTheme, () => {
    updateActualScorePlotLine();
    updatePlotLine(selectedScore.value);
});

onMounted(() => {
    initScore();
    setTimeout(() => {
        updateActualScorePlotLine();
        updatePlotLine(selectedScore.value);
    }, 150);
});

watch(() => props.record, () => {
    initScore();
    setTimeout(() => {
        updateActualScorePlotLine();
    }, 50);
}, { deep: true });

// 產生 Highcharts 預估折線數據點
const lineData = computed(() => {
    const constant = props.record.constant;
    const start = minScore.value;
    const end = 10000000;
    const step = 1000;
    
    const pointsMap = new Map<number, any>();
    
    // 1. 產生間隔點
    for (let s = start; s <= end; s += step) {
        pointsMap.set(s, {
            x: s,
            y: calculatePlayPtt(constant, s)
        });
    }
    // 確保包含 10000000
    if (!pointsMap.has(end)) {
        pointsMap.set(end, {
            x: end,
            y: calculatePlayPtt(constant, end)
        });
    }
    
    // 排序並轉回陣列
    return Array.from(pointsMap.values()).sort((a, b) => a.x - b.x);
});

// 產生獨立的當前實際成績點數據
const actualScorePointData = computed(() => {
    const constant = props.record.constant;
    const actualScore = currentScoreValue.value;
    const start = minScore.value;
    const end = 10000000;
    
    if (actualScore >= start && actualScore <= end) {
        return [{
            x: actualScore,
            y: calculatePlayPtt(constant, actualScore),
            marker: {
                enabled: true,
                radius: props.mini ? 3.5 : 4.5,
                fillColor: '#ef4444', // 霓虹亮紅色
                lineColor: isDarkTheme.value ? '#1e293b' : '#ffffff',
                lineWidth: 1.5,
                states: {
                    hover: {
                        enabled: true,
                        radius: props.mini ? 4.5 : 5.5
                    }
                }
            }
        }];
    }
    return [];
});

// Highcharts 選項設定
const chartOptions = computed(() => {
    const textColor = isDarkTheme.value ? '#cbd5e1' : '#1e293b';
    const gridLineColor = isDarkTheme.value ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.05)';

    return {
        chart: {
            type: 'line',
            height: props.mini ? 100 : 180,
            backgroundColor: 'transparent',
            spacingTop: props.mini ? 2 : 10,
            spacingBottom: props.mini ? 2 : 5,
            spacingLeft: props.mini ? 2 : 5,
            spacingRight: props.mini ? 2 : 5,
            events: {
                mouseOut: function() {
                    handleTouchEnd();
                }
            }
        },
        title: { text: null },
        credits: { enabled: false },
        xAxis: {
            title: { text: null },
            gridLineWidth: 0,
            tickWidth: 0,
            lineWidth: 0, // 移除 xAxis 底部的黑色框線
            labels: {
                enabled: !props.mini,
                style: { color: textColor, fontSize: '9px' },
                formatter: function () {
                    const val = this.value;
                    if (val === 10000000) return 'PM';
                    if (val === 9800000) return 'EX';
                    if (val === 9500000) return 'AA';
                    return (val / 1000000).toFixed(1) + 'M';
                }
            }
        },
        yAxis: {
            title: props.mini ? null : { 
                text: 'PTT',
                style: { color: textColor, fontSize: '9px' }
            },
            gridLineColor: props.mini ? 'transparent' : gridLineColor,
            labels: {
                enabled: !props.mini,
                style: { color: textColor, fontSize: '9px' }
            }
        },
        tooltip: {
            shared: true,
            followTouchMove: true,
            useHTML: true,
            backgroundColor: 'none',
            borderWidth: 0,
            shadow: false,
            style: {
                display: 'none',
                pointerEvents: 'none'
            },
            formatter: function () {
                const point = this.points ? this.points[0].point : this.point;
                const xVal = point.x;
                
                isInteracting.value = true;
                
                if (updateTimeoutId) {
                    clearTimeout(updateTimeoutId);
                }
                updateTimeoutId = setTimeout(() => {
                    selectedScore.value = xVal;
                }, 0);
                
                return '<div style="display: none;"></div>';
            }
        },
        legend: { enabled: false },
        series: [
            {
                name: '預估 PTT',
                type: 'line',
                data: lineData.value,
                color: isDarkTheme.value ? 'rgba(59, 130, 246, 0.6)' : 'rgba(59, 130, 246, 0.4)',
                lineWidth: props.mini ? 2 : 2.5,
                marker: {
                    enabled: false,
                    states: {
                        hover: {
                            enabled: false
                        }
                    }
                },
                states: {
                    hover: {
                        lineWidthPlus: 0.5
                    }
                }
            },
            {
                name: '當前成績',
                type: 'line',
                data: actualScorePointData.value,
                lineWidth: 0,
                linkedTo: ':previous',
                states: {
                    hover: {
                        lineWidthPlus: 0
                    }
                }
            }
        ]
    };
});
</script>

<style scoped lang="scss">
.inline-ptt-chart-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
    background: rgba(15, 23, 42, 0.15);
    border: none; // 移除外框線
    border-radius: 10px;
    width: 100%;
    box-sizing: border-box;
    margin-top: 0.5rem;
}

.chart-header-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 0.5rem;
    margin-bottom: 0.1rem;
    width: 100%;
    box-sizing: border-box;

    &.mini-header {
        flex-direction: column;
        align-items: stretch;
        gap: 0.15rem;
        padding: 0;
    }
}

.info-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .info-label {
        font-size: 0.75rem;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .info-value {
        font-size: 0.9rem;
        font-weight: 700;

        &.text-actual {
            color: var(--text-color);
        }

        &.text-actual-ptt {
            color: #ef4444; // 霓虹紅色，對應當前實際分數點
        }

        &.text-preview {
            color: #3b82f6; // 藍色，對應預覽直線
        }

        &.text-preview-ptt {
            color: #3b82f6;
        }
    }
}

.mini-header {
    .info-item {
        justify-content: space-between;
        width: 100%;
        border-bottom: 1px dashed var(--border-color);
        padding-bottom: 2px;

        &:last-child {
            border-bottom: none;
            padding-bottom: 0;
        }

        .info-label {
            font-size: 0.65rem;
        }

        .info-value {
            font-size: 0.75rem;
        }
    }
}

.chart-container-inline {
    width: 100%;
    height: 180px;
    touch-action: pan-y;
}

.inline-ptt-chart-container.mini-container {
    padding: 0.4rem 0.5rem;
    background: rgba(15, 23, 42, 0.15);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    box-shadow: none;
    gap: 0.25rem;
    margin-top: 0;
}

// 日間模式微調
:root:not(.p-dark) {
    .inline-ptt-chart-container {
        background: rgba(15, 23, 42, 0.02);
    }
    .inline-ptt-chart-container.mini-container {
        background: rgba(15, 23, 42, 0.02);
    }
}
</style>
