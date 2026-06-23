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
                <Tab value="changelog">
                    <i class="pi pi-info-circle tab-icon"></i>更新日誌
                </Tab>
            </TabList>
            <TabPanels class="home-tabpanels">
                <TabPanel value="table">
                    <RecordsDashboard />
                </TabPanel>
                <TabPanel value="chart">
                    <ChartsDashboard />
                </TabPanel>
                <TabPanel value="changelog">
                    <ChangelogPanel />
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
import ChangelogPanel from "@/components/dashboard/ChangelogPanel.vue";
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

// 日間模式適應樣式 (Day/Light Mode)
:root:not(.p-dark) {
  .tabs-card-wrapper {
    background: rgba(255, 255, 255, 0.7);
    border-color: rgba(15, 23, 42, 0.05);
  }
}
</style>
