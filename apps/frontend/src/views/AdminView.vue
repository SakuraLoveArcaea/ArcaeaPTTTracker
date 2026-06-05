<template>
    <Toast />
    <ConfirmDialog />
    <div class="admin-dashboard-wrapper">
        <!-- 頂部管理導覽列 (Admin NavBar) -->
        <header class="admin-navbar-wrapper">
            <nav class="admin-navbar glass-panel">
                <!-- 左側：標題與 LOGO -->
                <div class="navbar-brand">
                    <i class="pi pi-shield brand-icon"></i>
                    <h2 class="brand-title">
                        <span class="desktop-title">Arcaea 管理後台</span>
                        <span class="mobile-title">管理後台</span>
                    </h2>
                </div>

                <!-- 中間：選取玩家的數據看板 (玻璃膠囊，同 Home NavBar) -->
                <div class="stats-container" v-if="selectedUserId && userRecords.length > 0">
                    <div class="stat-box b30" title="該玩家 Best 30 最佳成績平均潛力值">
                        <i class="pi pi-star-fill stat-icon"></i>
                        <span class="label">
                            <span class="desktop-label">B30 平均：</span>
                            <span class="mobile-label">B30:</span>
                        </span>
                        <span class="value">{{ userB30Avg.toFixed(4) }}</span>
                    </div>
                    <div class="stat-box r10" title="該玩家最高單曲前 10 次成績平均值">
                        <i class="pi pi-bolt stat-icon"></i>
                        <span class="label">
                            <span class="desktop-label">最高 R10 平均：</span>
                            <span class="mobile-label">R10:</span>
                        </span>
                        <span class="value">{{ userR10Avg.toFixed(4) }}</span>
                    </div>
                    <div class="stat-box max-ptt" title="該玩家預估理論最高潛力值">
                        <i class="pi pi-chart-line stat-icon"></i>
                        <span class="label">
                            <span class="desktop-label">預估最高 PTT：</span>
                            <span class="mobile-label">最高:</span>
                        </span>
                        <span class="value">{{ userMaxPtt.toFixed(4) }}</span>
                    </div>
                </div>
                <div class="stats-container-empty" v-else>
                    <span class="empty-stats-label">
                        <i class="pi pi-users"></i>
                        <span class="desktop-label">請選取一位玩家以同步載入數據看板</span>
                        <span class="mobile-label">請先選取一位玩家</span>
                    </span>
                </div>

                <!-- 右側：本機安全控制狀態 -->
                <div class="navbar-status">
                    <span class="status-indicator">
                        <span class="pulse-dot"></span>
                        <span class="desktop-label">本機安全控制 (127.0.0.1)</span>
                        <span class="mobile-label">安全連接</span>
                    </span>
                </div>
            </nav>
        </header>

        <!-- 獨立的玩家選擇與控制列 (Player Selector Bar) -->
        <div class="selector-banner glass-panel">
            <div class="selector-left">
                <i class="pi pi-compass selector-icon"></i>
                <span class="selector-hint-text">
                    請選取玩家以同步展示其成績數據、Best 30 圖表及潛力值細節。
                </span>
            </div>
            <div class="selector-right">
                <Select
                    v-model="selectedUserId"
                    :options="userOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="請選擇一位玩家"
                    showClear
                    fluid
                    class="player-select"
                />
            </div>
        </div>

        <!-- 主面板區域 (若未選取玩家則呈現 Empty State，否則顯示 Tabs 內容) -->
        <div class="admin-content-grid">
            <transition name="fade" mode="out-in">
                <!-- Empty State -->
                <div v-if="!selectedUserId" class="empty-portal-state glass-panel">
                    <i class="pi pi-users portal-icon"></i>
                    <h2>請選擇一位玩家</h2>
                    <p>請在上方選單選擇一位玩家。載入後，此處將以圖表和表格形式完整呈現該玩家的 Arcaea 成績分布及 B30 分析。</p>
                </div>

                <!-- Tabs Card Wrapper (同 Home) -->
                <div v-else class="tabs-card-wrapper glass-panel">
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
                                    <RecordsTable
                                        :records="userRecords"
                                        :isLoading="loading"
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
                                    <Best30Charts :records="userRecords" />
                                </div>
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                </div>
            </transition>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import ConfirmDialog from 'primevue/confirmdialog';
import Toast from 'primevue/toast';
import Select from 'primevue/select';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import RecordsTable from '../components/table/recordTable/RecordsTable.vue';
import Best30Charts from "@/components/charts/best30Charts.vue";
import { useUIStore } from '@/stores/uiStore';

const users = ref<any[]>([]); // 儲存所有使用者清單
const userRecords = ref<any[]>([]); // 儲存當前選中玩家的成績
const loading = ref(false);
const selectedUserId = ref<string | null>(null);

// 1. 取得使用者列表 (初始化時呼叫)
const fetchUsers = async () => {
    try {
        const response = await fetch('http://127.0.0.1:3000/api/users');
        users.value = await response.json();
    } catch (error) {
        console.error("獲取玩家列表失敗:", error);
    }
};

// 2. 將使用者資料轉換成下拉選單選項
const userOptions = computed(() => {
    return users.value.map(user => ({
        label: `玩家: ${String(user.uid).substring(0, 8)}...`,
        value: user.uid
    }));
});

// 3. 計算該玩家的 B30 平均
const userB30Avg = computed(() => {
    if (!userRecords.value || userRecords.value.length === 0) return 0;
    const sorted = [...userRecords.value].sort((a, b) => b.playPtt - a.playPtt);
    const b30 = sorted.slice(0, 30);
    const sum = b30.reduce((acc, cur) => acc + (Number(cur.playPtt) || 0), 0);
    return sum / 30;
});

// 計算該玩家的 R10 平均 (以最高單曲前 10 次成績)
const userR10Avg = computed(() => {
    if (!userRecords.value || userRecords.value.length === 0) return 0;
    const sorted = [...userRecords.value].sort((a, b) => b.playPtt - a.playPtt);
    const b10 = sorted.slice(0, 10);
    const sum = b10.reduce((acc, cur) => acc + (Number(cur.playPtt) || 0), 0);
    return sum / (b10.length === 10 ? 10 : b10.length);
});

// 計算該玩家的預估最高 PTT
const userMaxPtt = computed(() => {
    return (userB30Avg.value * 30 + userR10Avg.value * 10) / 40;
});

// 5. 取得特定玩家的成績 (當選擇改變時呼叫)
const fetchUserRecords = async (newUserId: string | null) => {
    if (!newUserId) {
        userRecords.value = [];
        return;
    }

    loading.value = true;
    try {
        const response = await fetch(`http://127.0.0.1:3000/api/users/${newUserId}/records`);
        userRecords.value = await response.json();
    } catch (error) {
        console.error("獲取玩家成績失敗:", error);
    } finally {
        loading.value = false;
    }
};

// 監聽下拉選單變化，自動觸發資料獲取
watch(selectedUserId, (newValue) => {
    fetchUserRecords(newValue);
});

const UIStore = useUIStore();

// 元件掛載時，先獲取所有玩家並初始化主題
onMounted(() => {
    UIStore.initTheme();
    UIStore.activeTab = 'table'; // 進入頁面預設在成績表格 Tab
    fetchUsers();
});
</script>

<style scoped lang="scss">
.admin-dashboard-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  box-sizing: border-box;

  @media (max-width: 768px) {
    gap: 0.75rem;
  }
}

.admin-navbar-wrapper {
  width: 100%;
}

// 管理後台導覽列
.admin-navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem 1.5rem;
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  width: 100%;
  box-sizing: border-box;
}

// 品牌 LOGO 區
.navbar-brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  
  .brand-icon {
    font-size: 1.35rem;
    color: #3b82f6;
  }

  .brand-title {
    font-size: 1.15rem;
    font-weight: 700;
    margin: 0;
    letter-spacing: -0.02em;
    background: linear-gradient(135deg, #ffffff, #cbd5e1);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}

.mobile-title {
  display: none;
}
.desktop-title {
  display: inline;
}

// 指標膠囊看板 (與 Home NavBar 一致)
.stats-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;

  .stat-box {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 9999px;
    font-size: 0.85rem;
    font-weight: 600;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: rgba(15, 23, 42, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.05);
    cursor: default;

    .stat-icon {
      font-size: 0.85rem;
    }

    .label {
      color: #94a3b8;
    }

    .mobile-label {
      display: none;
    }
    .desktop-label {
      display: inline;
    }

    .value {
      font-family: 'Courier New', Courier, monospace;
      font-weight: 700;
      font-size: 1rem;
    }

    &.b30 {
      .stat-icon { color: #f59e0b; }
      .value { color: #f59e0b; }
      &:hover {
        background: rgba(245, 158, 11, 0.1);
        border-color: rgba(245, 158, 11, 0.3);
        transform: translateY(-2px);
      }
    }

    &.r10 {
      .stat-icon { color: #10b981; }
      .value { color: #10b981; }
      &:hover {
        background: rgba(16, 185, 129, 0.1);
        border-color: rgba(16, 185, 129, 0.3);
        transform: translateY(-2px);
      }
    }

    &.max-ptt {
      .stat-icon { color: #3b82f6; }
      .value { color: #3b82f6; }
      &:hover {
        background: rgba(59, 130, 246, 0.1);
        border-color: rgba(59, 130, 246, 0.3);
        transform: translateY(-2px);
      }
    }
  }
}

// 空統計數據占位膠囊
.stats-container-empty {
  display: flex;
  align-items: center;
  justify-content: center;

  .empty-stats-label {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.82rem;
    color: var(--text-muted);
    background: rgba(255, 255, 255, 0.02);
    border: 1px dashed var(--border-color);
    padding: 0.45rem 1.2rem;
    border-radius: 9999px;

    i {
      font-size: 0.9rem;
    }

    .mobile-label {
      display: none;
    }
    .desktop-label {
      display: inline;
    }
  }
}

// 右側安全連接指示
.navbar-status {
  display: flex;
  align-items: center;

  .status-indicator {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    font-weight: 600;
    color: #10b981;
    background: rgba(16, 185, 129, 0.1);
    padding: 0.35rem 0.75rem;
    border-radius: 9999px;
    border: 1px solid rgba(16, 185, 129, 0.2);

    .mobile-label {
      display: none;
    }
    .desktop-label {
      display: inline;
    }
  }

  .pulse-dot {
    width: 6px;
    height: 6px;
    background-color: #10b981;
    border-radius: 50%;
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
    animation: pulse 1.6s infinite;
  }
}

// 獨立的玩家選擇與控制條
.selector-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem 1.25rem;
  background: rgba(59, 130, 246, 0.08);
  border-left: 4px solid #3b82f6;
  border-radius: 6px;
  box-sizing: border-box;

  .selector-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 0;

    .selector-icon {
      color: #3b82f6;
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .selector-hint-text {
      font-size: 0.85rem;
      color: var(--text-muted);
      line-height: 1.5;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .selector-right {
    flex-shrink: 0;
    width: 240px;
  }
}

.admin-content-grid {
  width: 100%;
}

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

// 未選擇玩家的引導狀態
.empty-portal-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 6rem 2rem;
  background: rgba(30, 41, 59, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;

  .portal-icon {
    font-size: 4rem;
    color: #475569;
    margin-bottom: 1.5rem;
    animation: float 4s ease-in-out infinite;
  }

  h2 {
    font-size: 1.4rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    color: #f8fafc;
  }

  p {
    font-size: 0.9rem;
    color: var(--text-muted);
    max-width: 480px;
    line-height: 1.6;
    margin: 0;
  }
}

// 動畫定義
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(16, 185, 129, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

// 響應式佈局重新設計 (手機版與平板)
@media (max-width: 1024px) {
  .admin-navbar {
    display: grid !important;
    grid-template-columns: 1fr auto !important;
    grid-template-rows: auto auto !important;
    gap: 0.5rem;
    padding: 0.65rem 0.85rem;
  }

  .navbar-brand {
    grid-column: 1 !important;
    grid-row: 1 !important;
    justify-content: flex-start;
  }

  .navbar-status {
    grid-column: 2 !important;
    grid-row: 1 !important;
    justify-content: flex-end;
  }

  .desktop-title {
    display: none;
  }
  .mobile-title {
    display: inline;
  }

  // 指標看板手機版精簡化 (同 Home NavBar)
  .stats-container {
    grid-column: span 2 !important;
    grid-row: 2 !important;
    width: 100%;
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: nowrap !important;
    justify-content: space-between !important;
    gap: 0.2rem !important;
    border-top: 1px solid var(--border-color);
    padding-top: 0.45rem;
    margin-top: 0.1rem;

    .stat-box {
      background: transparent !important;
      border: none !important;
      padding: 0 !important;
      font-size: 0.72rem !important;
      gap: 0.15rem !important;
      transform: none !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      display: inline-flex !important;
      align-items: center !important;
      white-space: nowrap !important;
      flex-shrink: 0 !important;

      .stat-icon {
        font-size: 0.75rem !important;
      }

      .desktop-label {
        display: none;
      }
      .mobile-label {
        display: inline;
        font-size: 0.68rem !important;
        margin-right: 0.05rem;
      }

      .value {
        font-size: 0.8rem !important;
      }
    }
  }

  .stats-container-empty {
    grid-column: span 2 !important;
    grid-row: 2 !important;
    width: 100%;
    margin-top: 0.1rem;
    border-top: 1px solid var(--border-color);
    padding-top: 0.45rem;

    .empty-stats-label {
      border: none !important;
      background: transparent !important;
      padding: 0 !important;
      font-size: 0.72rem !important;
      gap: 0.25rem !important;

      .desktop-label {
        display: none;
      }
      .mobile-label {
        display: inline;
      }
    }
  }
}

@media (max-width: 768px) {
  .navbar-status .status-indicator {
    padding: 0.2rem;
    background: transparent !important;
    border: none !important;

    .desktop-label, .mobile-label {
      display: none !important;
    }
  }

  .selector-banner {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;

    .selector-left {
      .selector-hint-text {
        white-space: normal;
        overflow: visible;
        text-overflow: clip;
      }
    }

    .selector-right {
      width: 100%;
    }
  }

  .empty-portal-state {
    padding: 4rem 1rem;
    .portal-icon {
      font-size: 3rem;
    }
    h2 {
      font-size: 1.2rem;
    }
  }
}

// 日間模式適應樣式 (Day/Light Mode)
:root:not(.p-dark) {
  .admin-navbar {
    background: rgba(255, 255, 255, 0.7);
    border-color: rgba(15, 23, 42, 0.05);
    .brand-title {
      background: linear-gradient(135deg, #0f172a, #475569);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }

  .stats-container .stat-box {
    background: rgba(255, 255, 255, 0.9);
    border-color: rgba(15, 23, 42, 0.05);

    .label {
      color: #64748b;
    }
  }

  @media (max-width: 1024px) {
    .stats-container .stat-box {
      background: transparent !important;
      border: none !important;
    }
  }

  .selector-banner {
    background: rgba(59, 130, 246, 0.05);
    .selector-hint-text {
      color: #475569;
    }
  }

  .tabs-card-wrapper, .empty-portal-state {
    background: rgba(255, 255, 255, 0.7);
    border-color: rgba(15, 23, 42, 0.05);
  }

  .panel-title, .empty-portal-state h2 {
    color: #0f172a;
  }
}
</style>