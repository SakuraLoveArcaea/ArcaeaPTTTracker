<template>
    <Toast />
    <div class="home-dashboard-wrapper">
        <!-- 頂部導覽列 -->
        <header class="navbar-wrapper">
            <NavBar />
        </header>

        <!-- Tab 標籤頁 Dashboard 佈局 -->
        <div class="dashboard-content-grid">
            <div class="tabs-card-wrapper glass-panel">
                <Tabs value="table">
                    <TabList>
                        <Tab value="table">
                            <i class="pi pi-table tab-icon"></i>成績表格
                        </Tab>
                        <Tab value="chart">
                            <i class="pi pi-chart-line tab-icon"></i>B30 分佈圖表
                        </Tab>
                    </TabList>
                    <TabPanels>
                        <TabPanel value="table">
                            <div class="panel-header-row">
                                <h3 class="panel-title">
                                    <i class="pi pi-list title-icon"></i>
                                    成績紀錄清單
                                </h3>
                            </div>
                            <TableView />
                        </TabPanel>
                        <TabPanel value="chart">
                            <div class="panel-header-row">
                                <h3 class="panel-title">
                                    <i class="pi pi-chart-line title-icon"></i>
                                    Best 30 潛力值分佈
                                </h3>
                            </div>
                            <div class="chart-container">
                                <Best30Charts />
                            </div>
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </div>
        </div>
    </div>
    
    <!-- 新增成績 Dialog -->
    <AddRecordDialog v-model:visible="isAddDialogOpen" @save="handleSave"/>

    <!-- 懸浮新增按鈕 (FAB) -->
    <div class="fab-container">
        <Button
            icon="pi pi-plus"
            severity="primary"
            rounded
            raised
            class="fab-btn"
            @click="isAddDialogOpen = true"
            :title="`新增成績 (${isMac ? '⌘K' : 'Ctrl+K'})`"
        />
    </div>
</template>

<script setup lang="ts">
import NavBar from "@/components/navbar/NavBar.vue";
import TableView from "@/components/table/TableView.vue";
import AddRecordDialog from "@/components/dialogs/AddRecordDialog.vue";
import Button from 'primevue/button';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import { useAuthStore } from "@/stores/authStore";
import { auth } from "@/firebase";
import { useRecordsStore } from "@/stores/recordsStore";
import { onAuthStateChanged } from "firebase/auth";
import { storeToRefs } from "pinia";
import { onMounted, onUnmounted, ref, watch, nextTick } from "vue";
import { User } from "firebase/auth";
import Toast from 'primevue/toast';
import { useUIStore } from "@/stores/uiStore";
import Best30Charts from "@/components/charts/best30Charts.vue";

const recordsStore = useRecordsStore();
const UIStore = useUIStore();

const { isAddDialogOpen } = storeToRefs(UIStore)
const { onAddRecordForm } = recordsStore

const isMac = ref(navigator.userAgent.toUpperCase().indexOf('MAC') >= 0);

// 當對話框關閉時，鎖定目前的滾動位置，防止 PrimeVue 焦點管理引發的滾動跳動
watch(isAddDialogOpen, (newVal) => {
    if (!newVal) {
        const scrollY = window.scrollY;
        const restoreScroll = () => {
            if (window.scrollY !== scrollY) {
                window.scrollTo(0, scrollY);
            }
        };
        // 使用多重框架與時間延遲防護
        requestAnimationFrame(restoreScroll);
        setTimeout(restoreScroll, 0);
        setTimeout(restoreScroll, 30);
    }
});

const onKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        
        // 將焦點移至懸浮按鈕上，防止關閉彈窗時焦點回歸 body 觸發瀏覽器滾動至最上方
        const fabBtn = document.querySelector('.fab-btn') as HTMLButtonElement;
        if (fabBtn && typeof fabBtn.focus === 'function') {
            fabBtn.focus();
        }
        
        isAddDialogOpen.value = true;
    }
}

const handleSave = (form: any) => {
    onAddRecordForm(form)
    isAddDialogOpen.value = false;
}

const store = useAuthStore();

onMounted(() => {
    UIStore.initTheme();
    onAuthStateChanged(auth, async (user: User | null) => {
        if (user) {
            store.setCurrentUser(user);
        } else {
            store.setCurrentUser(null);
        }
    })
})

onMounted(() => {
    window.addEventListener('keydown', onKeyDown);
});

onUnmounted(() => {
    window.removeEventListener('keydown', onKeyDown);
});
</script>

<style scoped lang="scss">
.home-dashboard-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  box-sizing: border-box;
}

.navbar-wrapper {
  width: 100%;
}

.dashboard-content-grid {
  width: 100%;
}

.tabs-card-wrapper {
  background: rgba(30, 41, 59, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  overflow: hidden;
  padding: 0; /* flush tabs to card borders */
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

/* PrimeVue Tabs 內部樣式穿透與深度自定義樣式 */
:deep(.p-tabs) {
  background: transparent !important;
  display: flex;
  flex-direction: column;
}

:deep(.p-tablist) {
  background: var(--dialog-header-bg) !important;
  border-bottom: 1px solid var(--border-color) !important;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  
  .p-tablist-content {
    background: transparent !important;
  }
}

:deep(.p-tablist-tablist) {
  display: flex;
  background: transparent !important;
  border: none !important;
}

:deep(.p-tab) {
  color: var(--text-muted) !important;
  font-weight: 600 !important;
  background: transparent !important;
  border: none !important;
  padding: 1rem 1.5rem !important;
  transition: all 0.25s ease !important;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;

  .tab-icon {
    font-size: 0.9rem;
  }

  &:hover {
    color: var(--text-color) !important;
    background: var(--options-bg) !important;
  }

  &.p-tab-active {
    color: #3b82f6 !important;
    font-weight: 700 !important;
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 3px;
      background-color: #3b82f6;
      border-top-left-radius: 3px;
      border-top-right-radius: 3px;
    }
  }
}

:deep(.p-tabpanels) {
  background: transparent !important;
  padding: 1.5rem !important;
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

/* 懸浮按鈕 (FAB) */
.fab-container {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 99;
}

.fab-btn {
  width: 56px !important;
  height: 56px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.35) !important;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
  border: none !important;

  :deep(.p-button-icon) {
    font-size: 1.35rem !important;
  }

  &:hover {
    transform: translateY(-4px) scale(1.05) !important;
    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.5) !important;
  }

  &:active {
    transform: translateY(-1px) scale(0.95) !important;
  }
}

@media (max-width: 768px) {
  .fab-container {
    bottom: 1.5rem;
    right: 1.5rem;
  }

  .fab-btn {
    width: 48px !important;
    height: 48px !important;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3) !important;
    
    :deep(.p-button-icon) {
      font-size: 1.15rem !important;
    }
    
    &:hover {
      transform: translateY(-2px) scale(1.03) !important;
    }
  }
}
</style>