<template>
    <div class="chart-wrapper">
        <div class="chart-header">
            <h3>Arcaea PTT 計算工具 (Constant: {{ CONSTANT }})</h3>
            <p>滑鼠在圖上移動可平滑追蹤任意分數的精確 PTT</p>
        </div>

        <div class="chart-container">
            <Chart :options="chartOptions" ref="chartComponent"></Chart>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Chart } from 'highcharts-vue';


// --- 1. 設定基礎數值 ---
const CONSTANT = 10.0; // 你可以根據需求改成 props 或動態變數

// --- 2. PTT 計算公式 (完全還原你的邏輯) ---
const calculatePtt = (score) => {
    const fullScore = score;
    let ptt = 0;

    if (fullScore >= 10000000) {
        ptt = CONSTANT + 2.0;
    } else if (fullScore >= 9800000) {
        ptt = CONSTANT + 1.0 + (fullScore - 9800000) / 200000;
    } else if (fullScore >= 9500000) {
        ptt = CONSTANT + (fullScore - 9500000) / 300000;
    } else {
        // 處理 9.5M 以下的線性延伸
        ptt = CONSTANT + (fullScore - 9500000) / 300000;
    }
    return Math.max(0, parseFloat(ptt.toFixed(4)));
};

// --- 3. Highcharts 配置 ---
const chartOptions = computed(() => ({
    chart: {
        type: 'line',
        backgroundColor: '#ffffff',
        events: {
            mouseMove: function (e) {
                const chart = this;
                const xAxis = chart.xAxis[0];
                const yAxis = chart.yAxis[0];

                // 轉換滑鼠坐標為數據值 (不吸附點，直接抓坐標)
                const currentX = xAxis.toValue(e.chartX);

                // 只在數據範圍內觸發
                if (currentX >= 9500000 && currentX <= 10000000) {
                    const currentY = calculatePtt(currentX);

                    // 手動顯示 X 和 Y 的 Crosshair (組成「十」字)
                    xAxis.drawCrosshair(e, { x: currentX, y: currentY, plotX: xAxis.toPixels(currentX, true), plotY: yAxis.toPixels(currentY, true) });
                    yAxis.drawCrosshair(e, { x: currentX, y: currentY, plotX: xAxis.toPixels(currentX, true), plotY: yAxis.toPixels(currentY, true) });

                    // 手動刷新 Tooltip，傳入模擬點以實現「完全平滑」顯示
                    chart.tooltip.refresh({
                        x: currentX,
                        y: currentY,
                        series: chart.series[0],
                        getLabelConfig: function() {
                            return { x: this.x, y: this.y };
                        }
                    });
                }
            },
            mouseOut: function () {
                // 滑鼠離開時隱藏十字與 Tooltip
                this.xAxis[0].hideCrosshair();
                this.yAxis[0].hideCrosshair();
                this.tooltip.hide();
            }
        }
    },
    title: { text: null },
    xAxis: {
        min: 9500000,
        max: 10000000,
        tickInterval: 100000,
        gridLineWidth: 1,
        gridLineDashStyle: 'Dot',
        title: { text: 'Score' },
        labels: {
            formatter: function () {
                return (this.value / 10000).toFixed(0) + 'w';
            }
        },
        // 設定 Crosshair 樣式
        crosshair: {
            snap: false,
            width: 1,
            color: '#ff4757',
            dashStyle: 'Dash'
        }
    },
    yAxis: {
        title: { text: 'PTT Value' },
        gridLineDashStyle: 'Dot',
        // 設定 Crosshair 樣式 (組成橫向的那一條)
        crosshair: {
            // snap: false,
            width: 1,
            color: '#ff4757',
            dashStyle: 'Dash'
        }
    },
    tooltip: {
        enabled: true,
        shared: false,
        followPointer: true, // 讓視窗跟著鼠標跑
        animation: false,    // 關閉動畫讓移動更即時流暢
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 8,
        padding: 10,
        headerFormat: '',
        pointFormatter: function() {
            return `<span style="color:#ff4757">●</span> <b>Score:</b> ${Math.round(this.x).toLocaleString()}<br/>` +
                `<span style="color:#2f3542">●</span> <b>PTT:</b> ${this.y.toFixed(4)}`;
        }
    },
    plotOptions: {
        line: {
            lineWidth: 3,
            color: '#5352ed',
            marker: {
                enabled: true,
                radius: 5,
                fillColor: '#ffffff',
                lineWidth: 2,
                lineColor: '#5352ed'
            },
            states: {
                hover: { enabled: false } // 關閉點的 hover 縮放，保持純淨
            }
        }
    },
    series: [{
        name: 'PTT Line',
        // 只需要提供首、中、尾三個固定點，Highcharts 會連成平滑的直線
        data: [
            [9500000, calculatePtt(9500000)],
            [9800000, calculatePtt(9800000)],
            [10000000, calculatePtt(10000000)]
        ],
        zIndex: 2
    }],
    credits: { enabled: false }
}));
</script>

<style scoped>
.chart-wrapper {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    max-width: 900px;
    margin: 20px auto;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
}

.chart-header {
    margin-bottom: 20px;
    text-align: center;
}

.chart-header h3 {
    margin: 0;
    color: #2f3542;
}

.chart-header p {
    font-size: 14px;
    color: #747d8c;
}

.chart-container {
    height: 450px;
    background: #ffffff;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #e1e4e8;
}
</style>