<template>
    <div class="charts-dashboard-container">
        <!-- 標題欄位 -->
        <div class="panel-header-row">
            <h3 class="panel-title">
                <i class="pi pi-chart-line title-icon"></i>
                Best 30 潛力值分佈
            </h3>
        </div>
        
        <!-- 圖表區塊 -->
        <div class="chart-container">
            <Best30Charts />
        </div>
    </div>
</template>

<script setup lang="ts">
import Best30Charts from "./Best30Charts.vue";
</script>

<style scoped lang="scss">
.charts-dashboard-container {
  width: 100%;
}

.panel-header-row {
  margin-bottom: 1.25rem;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.05rem;
  font-weight: 700;
  color: #f8fafc;
  margin-top: 0;
  margin-bottom: 0;

  .title-icon {
    color: #3b82f6;
    font-size: 1.1rem;
  }
}

.chart-container {
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

// 日間模式適應樣式 (Day/Light Mode)
:root:not(.p-dark) {
  .panel-title {
    color: #0f172a;
  }
}
</style>
