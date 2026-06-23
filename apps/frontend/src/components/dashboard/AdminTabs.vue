<template>
    <div class="tabs-card-wrapper glass-panel">
        <Tabs v-model:value="UIStore.activeTab" class="admin-tabs">
            <TabList class="admin-tablist">
                <Tab value="table">
                    <i class="pi pi-table tab-icon"></i>成績表格
                </Tab>
                <Tab value="chart">
                    <i class="pi pi-chart-line tab-icon"></i>B30 分佈圖表
                </Tab>
            </TabList>
            <TabPanels class="admin-tabpanels">
                <TabPanel value="table" class="admin-tabpanel">
                    <div class="panel-header-row">
                        <h3 class="panel-title">
                            <i class="pi pi-list title-icon"></i>
                            成績紀錄清單 (唯讀)
                        </h3>
                        <span class="read-only-badge">
                            <i class="pi pi-eye"></i> 唯讀模式
                        </span>
                    </div>
                    <div class="table-scroll-container">
                        <RecordsDispatcher
                            :records="records"
                            :isLoading="isLoading"
                            :editable="false"
                            :deletable="false"
                        />
                    </div>
                </TabPanel>
                <TabPanel value="chart" class="admin-tabpanel">
                    <div class="panel-header-row">
                        <h3 class="panel-title">
                            <i class="pi pi-chart-line title-icon"></i>
                            Best 30 PTT 曲線與分佈
                        </h3>
                    </div>
                    <div class="chart-container">
                        <Best30Charts :records="records" />
                    </div>
                </TabPanel>
            </TabPanels>
        </Tabs>
    </div>
</template>

<script setup lang="ts">
import { type PropType } from 'vue';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import RecordsDispatcher from '@/components/records/RecordsDispatcher.vue';
import Best30Charts from "@/components/charts/best30Charts.vue";
import { useUIStore } from '@/stores/uiStore';
import { type Record } from '@/utils/record';

defineProps({
    records: {
        type: Array as PropType<Record[]>,
        default: () => []
    },
    isLoading: {
        type: Boolean,
        default: false
    }
});

const UIStore = useUIStore();
</script>

<style scoped lang="scss">
.tabs-card-wrapper {
  background: rgba(30, 41, 59, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  overflow: hidden;
  padding: 0;
}

.panel-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  flex-shrink: 0;
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

.read-only-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.table-scroll-container, .chart-container {
  width: 100%;
  box-sizing: border-box;
}

.admin-tabs {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.admin-tablist {
  background: var(--dialog-header-bg) !important;
  border-bottom: 1px solid var(--border-color) !important;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}

.admin-tabpanels {
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

  .panel-title {
    color: #0f172a;
  }
}
</style>
