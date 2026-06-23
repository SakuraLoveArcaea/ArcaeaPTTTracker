<template>
    <Chart :options="chartOptions"></Chart>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';
import { Chart } from 'highcharts-vue';

const props = defineProps({
    chartData: {
        type: Array as PropType<Array<{
            y: number;
            title: string;
            constant: number;
            score: number;
            difficulty: string;
            id: string;
        }>>,
        required: true
    },
    chartHeight: {
        type: Number,
        default: 360
    },
    isMobileView: {
        type: Boolean,
        default: false
    },
    isDarkTheme: {
        type: Boolean,
        default: true
    },
    showMeanLine: {
        type: Boolean,
        default: true
    },
    showMedianLine: {
        type: Boolean,
        default: false
    },
    showSinglePttLine: {
        type: Boolean,
        default: true
    },
    showSongNamesOnX: {
        type: Boolean,
        default: true
    },
    stats: {
        type: Object as PropType<{
            mean: number;
            median: number;
            stdDev: number;
            min: number;
            max: number;
        }>,
        required: true
    }
});

const emit = defineEmits<{
    (e: 'toggle-single-ptt'): void;
    (e: 'toggle-mean'): void;
    (e: 'toggle-median'): void;
}>();

const yAxisMin = computed(() => {
    if (props.chartData.length === 0) return null;
    return Math.min(...props.chartData.map(item => item.y));
});

const yAxisMax = computed(() => {
    if (props.chartData.length === 0) return null;
    return Math.max(...props.chartData.map(item => item.y));
});

const chartOptions = computed(() => {
    const textColor = props.isDarkTheme ? '#cbd5e1' : '#1e293b';
    const gridLineColor = props.isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.05)';

    // 動態建置 Y 軸輔助線 (平均值與中位數)
    const plotLines: any[] = [];
    if (props.showMeanLine && props.chartData.length > 0) {
        plotLines.push({
            value: props.stats.mean,
            color: '#f59e0b', // 黃金色輔助線
            width: 2,
            dashStyle: 'Dash',
            zIndex: 4,
            label: {
                text: `B30 平均: ${props.stats.mean.toFixed(4)}`,
                align: 'right',
                x: -10,
                style: {
                    color: '#f59e0b',
                    fontWeight: 'bold',
                    fontSize: '11px',
                    textOutline: props.isDarkTheme ? '1px #000' : '1px #fff'
                }
            }
        });
    }
    if (props.showMedianLine && props.chartData.length > 0) {
        plotLines.push({
            value: props.stats.median,
            color: '#10b981', // 翡翠綠輔助線
            width: 2,
            dashStyle: 'ShortDot',
            zIndex: 4,
            label: {
                text: `中位數: ${props.stats.median.toFixed(4)}`,
                align: 'right',
                x: -10,
                style: {
                    color: '#10b981',
                    fontWeight: 'bold',
                    fontSize: '11px',
                    textOutline: props.isDarkTheme ? '1px #000' : '1px #fff'
                }
            }
        });
    }

    return {
        chart: {
            type: 'line',
            height: props.chartHeight,
            backgroundColor: 'transparent',
            spacingBottom: props.isMobileView ? 5 : 15,
            spacingLeft: props.isMobileView ? 5 : 10,
            spacingRight: props.isMobileView ? 5 : 10,
            spacingTop: props.isMobileView ? 5 : 15,
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
                text: props.isMobileView ? null : (props.showSongNamesOnX ? '歌曲' : '排名'),
                style: { color: textColor }
            },
            categories: props.showSongNamesOnX 
                ? props.chartData.map(item => item.title)
                : props.chartData.map((_, idx) => `#${idx + 1}`),
            crosshair: true,
            labels: {
                enabled: !props.isMobileView,
                rotation: props.showSongNamesOnX ? -90 : 0, // 顯示排名時橫向易讀，不需旋轉
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
            backgroundColor: props.isDarkTheme ? '#1e293b' : '#ffffff',
            borderColor: props.isDarkTheme ? '#334155' : '#cbd5e1',
            style: {
                color: props.isDarkTheme ? '#f8fafc' : '#0f172a',
                fontSize: '13px'
            },
            formatter: function () {
                const point = this.points[0].point;
                const exactValue = point.y.toLocaleString('zh-TW', { maximumFractionDigits: 4 });
                const formattedScore = point.score.toLocaleString('zh-TW');

                // 手機/平板版特別在 Tooltip 內加入定位按鈕
                const jumpBtnHtml = props.isMobileView ? `
                    <div style="margin-top: 8px; text-align: right;">
                        <a href="javascript:void(0)" onclick="window.jumpToRecord('${point.id}')" style="color: #3b82f6; font-size: 11px; font-weight: bold; text-decoration: none; border: 1px solid #3b82f6; padding: 3px 8px; border-radius: 4px; display: inline-block; background: rgba(59,130,246,0.05); cursor: pointer;">
                            🎯 定位此成績
                        </a>
                    </div>
                ` : '';

                return `
                    <div style="padding: 4px;">
                        <b>#${point.index + 1} - ${point.title}</b><br/>
                        <hr style="margin: 4px 0; border-top: 1px dashed ${props.isDarkTheme ? '#475569' : '#ccc'};"/>
                        難度：<b>${point.difficulty}</b><br/>
                        定數：<b>${point.constant.toFixed(1)}</b><br/>
                        分數：<b>${formattedScore}</b><br/>
                        <span style="color:${this.points[0].color}">\u25CF</span>
                        單曲 PTT：<b>${exactValue}</b>
                        ${jumpBtnHtml}
                    </div>
                `;
            },
        },
        series: [
            {
                name: '單曲 PTT',
                data: props.chartData,
                color: '#3b82f6',
                visible: props.showSinglePttLine,
                marker: {
                    enabled: true,
                    radius: props.isMobileView ? 3 : 4
                },
                events: {
                    legendItemClick: function () {
                        emit('toggle-single-ptt');
                        return false;
                    }
                }
            },
            {
                name: '平均值',
                color: '#f59e0b',
                visible: props.showMeanLine,
                data: [],
                dashStyle: 'Dash',
                marker: { enabled: false },
                events: {
                    legendItemClick: function () {
                        emit('toggle-mean');
                        return false;
                    }
                }
            },
            {
                name: '中位數',
                color: '#10b981',
                visible: props.showMedianLine,
                data: [],
                dashStyle: 'ShortDot',
                marker: { enabled: false },
                events: {
                    legendItemClick: function () {
                        emit('toggle-median');
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
