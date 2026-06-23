<template>
    <div class="tabs-card-wrapper glass-panel">
        <Tabs v-model:value="UIStore.activeTab">
            <TabList class="home-tablist">
                <Tab value="table">
                    <i class="pi pi-table tab-icon"></i>成績表格
                </Tab>
                <Tab value="chart">
                    <i class="pi pi-chart-line tab-icon"></i>B30 分佈圖表
                </Tab>
                <Tab value="recent">
                    <i class="pi pi-history tab-icon"></i>最近成績
                </Tab>
            </TabList>
            <TabPanels class="home-tabpanels">
                <TabPanel value="table">
                    <RecordsDashboard />
                </TabPanel>
                <TabPanel value="chart">
                    <ChartsDashboard />
                </TabPanel>
                <TabPanel value="recent">
                    <div class="recent-scores-placeholder">
                        <i class="pi pi-hourglass placeholder-icon"></i>
                        <h3>尚未更新，敬請期待</h3>
                        <p>我們正在開發「最近成績 (Recent Scores)」功能，未來此處將呈現您最近遊玩的成績與潛力值變動歷程！</p>
                    </div>
                </TabPanel>
            </TabPanels>
        </Tabs>
    </div>
</template>

<script setup lang="ts">
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import RecordsDashboard from "@/components/records/RecordsDashboard.vue";
import ChartsDashboard from "@/components/charts/ChartsDashboard.vue";
import { useUIStore } from "@/stores/uiStore";

const UIStore = useUIStore();
</script>

<style scoped lang="scss">
.tabs-card-wrapper {
  background: rgba(30, 41, 59, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  overflow: hidden;
  padding: 0; /* flush tabs to card borders */
}

.home-tablist {
  background: var(--dialog-header-bg) !important;
  border-bottom: 1px solid var(--border-color) !important;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}

.home-tabpanels {
  background: transparent !important;
  padding: 1.5rem !important;

  @media (max-width: 768px) {
    padding: 0.75rem !important;
  }
}

.recent-scores-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  text-align: center;
  background: rgba(255, 255, 255, 0.015);
  border: 1px dashed var(--border-color);
  border-radius: 12px;
  margin: 1rem 0;

  .placeholder-icon {
    font-size: 2.2rem;
    color: #3b82f6;
    margin-bottom: 1rem;
    animation: spin 2.5s linear infinite;
  }

  h3 {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-color);
    margin: 0 0 0.5rem 0;
  }

  p {
    font-size: 0.8rem;
    color: var(--text-muted);
    max-width: 320px;
    margin: 0;
    line-height: 1.5;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// 日間模式適應樣式 (Day/Light Mode)
:root:not(.p-dark) {
  .tabs-card-wrapper {
    background: rgba(255, 255, 255, 0.7);
    border-color: rgba(15, 23, 42, 0.05);
  }
}
</style>
