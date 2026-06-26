<template>
    <div class="tabs-card-wrapper glass-panel">
        <Tabs v-model:value="UIStore.activeTab">
            <TabList class="home-tablist">
                <Tab value="table">
                    <i class="pi pi-table tab-icon"></i>
                    <span class="tab-text">成績表格</span>
                </Tab>
                <Tab value="chart">
                    <i class="pi pi-chart-line tab-icon"></i>
                    <span class="tab-text">B30 分佈圖表</span>
                </Tab>
                <Tab value="recent">
                    <i class="pi pi-history tab-icon"></i>
                    <span class="tab-text">最近成績</span>
                </Tab>
                <Tab value="explore">
                    <i class="pi pi-folder tab-icon"></i>
                    <span class="tab-text">曲包瀏覽</span>
                </Tab>
            </TabList>
            <TabPanels class="home-tabpanels">
                <TabPanel value="table">
                    <RecordsDashboard />
                </TabPanel>
                <TabPanel value="chart">
                    <Best30Charts />
                </TabPanel>
                <TabPanel value="recent">
                    <div class="recent-scores-placeholder">
                        <i class="pi pi-hourglass placeholder-icon"></i>
                        <h3>尚未更新，敬請期待</h3>
                        <p>我們正在開發「最近成績 (Recent Scores)」功能，未來此處將呈現您最近遊玩的成績與潛力值變動歷程！</p>
                    </div>
                </TabPanel>
                <TabPanel value="explore">
                    <SongExplorer />
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
import RecordsDashboard from "@tracker/shared/components/records/RecordsDashboard.vue";
import Best30Charts from "@tracker/shared/components/charts/Best30Charts.vue";
import SongExplorer from "@tracker/shared/components/records/SongExplorer.vue";
import { useUIStore } from "@tracker/shared/stores/uiStore";

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

  :deep(.p-tablist-tab-list) {
    display: flex;
    width: 100%;
  }

  :deep(.p-tab) {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    padding: 0.75rem 1rem !important;

    @media (max-width: 768px) {
      padding: 0.75rem 0.5rem !important;
      flex: 1; /* 手機版均分寬度 */
    }
  }
}

.tab-icon {
  margin: 0 !important;
}

.tab-text {
  @media (max-width: 768px) {
    display: none; /* 手機版隱藏文字，僅顯示圖示 */
  }
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
