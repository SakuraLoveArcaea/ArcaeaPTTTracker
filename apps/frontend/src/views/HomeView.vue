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
                <Tabs v-model:value="UIStore.activeTab">
                    <TabList class="home-tablist">
                        <Tab value="table">
                            <i class="pi pi-table tab-icon"></i>成績表格
                        </Tab>
                        <Tab value="chart">
                            <i class="pi pi-chart-line tab-icon"></i>B30 分佈圖表
                        </Tab>
                    </TabList>
                    <TabPanels class="home-tabpanels">
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

    <!-- 懸浮新增按鈕 (FAB) - 僅在表格分頁顯示，避免遮擋圖表 -->
    <div v-if="UIStore.activeTab === 'table'" class="fab-container">
        <Button
            icon="pi pi-plus"
            rounded
            raised
            severity="success"
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
        UIStore.editingRecord = null; // 清除編輯狀態
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
    UIStore.activeTab = 'table'; // 進入頁面預設在成績表格 Tab
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

  @media (max-width: 768px) {
    gap: 0.75rem;
  }
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
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
  border-radius: 50% !important;

  :deep(.p-button-icon) {
    font-size: 1.35rem !important;
  }

  &:hover {
    transform: translateY(-4px) scale(1.05) !important;
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
    
    :deep(.p-button-icon) {
      font-size: 1.15rem !important;
    }
    
    &:hover {
      transform: translateY(-2px) scale(1.03) !important;
    }
  }
}
</style>