<template>
    <div class="admin-dashboard-container">
        <!-- 頂部標題列 -->
        <header class="admin-header glass-panel">
            <div class="header-left">
                <i class="pi pi-shield admin-shield-icon"></i>
                <h1 class="admin-title">Arcaea成績管理後台</h1>
            </div>
            <div class="header-right">
                <span class="status-indicator">
                    <span class="pulse-dot"></span>
                    本機安全控制 (127.0.0.1)
                </span>
            </div>
        </header>

        <!-- 主面板網格 -->
        <div class="admin-grid">
            <!-- 左側區域：玩家選擇器 -->
            <div class="admin-left-pane">
                <!-- 玩家選取面板 -->
                <aside class="sidebar-panel glass-panel">
                    <h2 class="panel-section-title">玩家選取門戶</h2>
                    <div class="selector-wrapper">
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

                    <!-- 玩家數據快照 (當已選擇玩家時呈現) -->
                    <transition name="fade">
                        <div v-if="selectedUserId && userRecords.length > 0" class="player-snapshot">
                            <div class="divider"></div>
                            <div class="player-profile">
                                <div class="avatar-placeholder">
                                    <i class="pi pi-user"></i>
                                </div>
                                <div class="profile-info">
                                    <span class="profile-name">玩家 ID: {{ selectedUserId.substring(0, 8) }}</span>
                                    <span class="profile-role">Arcaea 玩家</span>
                                </div>
                            </div>

                            <div class="divider"></div>
                            <h3 class="panel-section-title">數據概覽</h3>
                            <div class="stats-mini-grid">
                                <div class="mini-stat-card">
                                    <span class="label">B30 平均</span>
                                    <span class="value text-primary">{{ userB30Avg.toFixed(4) }}</span>
                                </div>
                                <div class="mini-stat-card">
                                    <span class="label">最高單曲 PTT</span>
                                    <span class="value text-success">{{ maxPlayPtt.toFixed(4) }}</span>
                                </div>
                                <div class="mini-stat-card">
                                    <span class="label">已記錄成績</span>
                                    <span class="value">{{ userRecords.length }} 首</span>
                                </div>
                            </div>
                        </div>
                    </transition>
                </aside>
            </div>

            <!-- 右側區域：唯讀成績表格/圖表 Tab 頁面 (若未選取玩家則呈現空狀態) -->
            <main class="admin-right-pane">
                <transition name="fade" mode="out-in">
                    <div v-if="!selectedUserId" class="empty-portal-state glass-panel">
                        <i class="pi pi-users portal-icon"></i>
                        <h2>請選擇一位玩家</h2>
                        <p>請使用左側選單選擇一位玩家以同步載入並展示其成績數據、Best 30 圖表及潛力值細節。</p>
                    </div>

                    <div v-else class="tabs-card-wrapper glass-panel">
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
                                    <div class="table-card-header">
                                        <h3 class="card-title">成績清單 (唯讀)</h3>
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
                                <TabPanel value="chart">
                                    <div class="chart-card-header">
                                        <h3 class="card-title">Best 30 PTT 曲線與分佈</h3>
                                    </div>
                                    <div class="chart-scroll-container">
                                        <Best30Charts :records="userRecords" />
                                    </div>
                                </TabPanel>
                            </TabPanels>
                        </Tabs>
                    </div>
                </transition>
            </main>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
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

// 4. 計算該玩家單曲最高 PTT
const maxPlayPtt = computed(() => {
    if (!userRecords.value || userRecords.value.length === 0) return 0;
    return Math.max(...userRecords.value.map(r => Number(r.playPtt) || 0));
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
    fetchUsers();
});
</script>

<style scoped lang="scss">
.admin-dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  box-sizing: border-box;
}

// 頂部標頭樣式
.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 2rem;
  border-radius: 12px;
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  flex-shrink: 0;

  .header-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    .admin-shield-icon {
      font-size: 1.8rem;
      color: #3b82f6;
    }

    .admin-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0;
      background: linear-gradient(135deg, #ffffff, #94a3b8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }

  .header-right {
    .status-indicator {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: #10b981;
      background: rgba(16, 185, 129, 0.1);
      padding: 0.35rem 0.75rem;
      border-radius: 9999px;
      border: 1px solid rgba(16, 185, 129, 0.2);
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      background-color: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
      animation: pulse 1.6s infinite;
    }
  }
}

// 預設垂直排版 (手機與平板螢幕)
.admin-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  align-items: start;
}

.admin-left-pane {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.admin-right-pane {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.tabs-card-wrapper {
  background: rgba(30, 41, 59, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  overflow: hidden;
  padding: 0; /* flush tabs to card borders */
}

.table-scroll-container, .chart-scroll-container {
  width: 100%;
}

// 桌上型電腦雙欄排版 (螢幕寬度大於 1024px)
@media (min-width: 1025px) {
  .admin-dashboard-container {
    height: calc(100vh - 3rem); /* 減去全域 #app 的 1.5rem * 2 上下外距，鎖定視窗高度 */
    overflow: hidden;
  }

  .admin-grid {
    grid-template-columns: 420px 1fr;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    height: 100%;
    align-items: stretch;
  }

  .admin-left-pane {
    height: 100%;
    overflow-y: auto;
    min-height: 0;
    padding-right: 0.5rem; /* 預留自定義滾動條寬度 */

    // 自定義滾動條 (符合 Chrome / Edge / Safari / Firefox 標準規格)
    --scrollbar-thumb: var(--border-color);
    --scrollbar-track: transparent;
    scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
    scrollbar-width: thin;

    @supports not (scrollbar-color: auto) {
      &::-webkit-scrollbar {
        width: 6px;
      }
      &::-webkit-scrollbar-thumb {
        background: var(--scrollbar-thumb);
        border-radius: 3px;
      }
      &::-webkit-scrollbar-track {
        background: var(--scrollbar-track);
      }
    }
  }

  .admin-right-pane {
    height: 100%;
    min-height: 0;
    overflow: hidden;
  }

  .tabs-card-wrapper {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    height: 100%;
  }

  .table-scroll-container, .chart-scroll-container {
    flex: 1;
    overflow-y: auto;
    min-height: 0;

    // 自定義滾動條 (符合 Chrome / Edge / Safari / Firefox 標準規格)
    --scrollbar-thumb: var(--border-color);
    --scrollbar-track: transparent;
    scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
    scrollbar-width: thin;

    @supports not (scrollbar-color: auto) {
      &::-webkit-scrollbar {
        width: 6px;
      }
      &::-webkit-scrollbar-thumb {
        background: var(--scrollbar-thumb);
        border-radius: 3px;
      }
      &::-webkit-scrollbar-track {
        background: var(--scrollbar-track);
      }
    }
  }

  .empty-portal-state {
    height: 100%;
    box-sizing: border-box;
    justify-content: center;
  }
}

// 側邊欄與區塊樣式
.sidebar-panel {
  padding: 1.5rem;
  background: rgba(30, 41, 59, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;

  .panel-section-title {
    font-size: 1rem;
    font-weight: 700;
    color: #94a3b8;
    margin-top: 0;
    margin-bottom: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .selector-wrapper {
    margin-bottom: 1.5rem;
  }
}

// 玩家數據快照
.player-snapshot {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;

  .divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.08);
    width: 100%;
  }

  .player-profile {
    display: flex;
    align-items: center;
    gap: 1rem;

    .avatar-placeholder {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(163, 85, 171, 0.2));
      border: 1px solid rgba(59, 130, 246, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #3b82f6;
      font-size: 1.25rem;
    }

    .profile-info {
      display: flex;
      flex-direction: column;
      
      .profile-name {
        font-weight: 700;
        color: #f8fafc;
        font-size: 0.95rem;
      }

      .profile-role {
        font-size: 0.75rem;
        color: #64748b;
      }
    }
  }

  .stats-mini-grid {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .mini-stat-card {
    background: rgba(15, 23, 42, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.03);
    padding: 0.75rem 1rem;
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .label {
      font-size: 0.8rem;
      color: #94a3b8;
      font-weight: 500;
    }

    .value {
      font-weight: 700;
      font-family: 'Courier New', Courier, monospace;
      font-size: 1rem;

      &.text-primary { color: #3b82f6; }
      &.text-success { color: #10b981; }
    }
  }
}

// 未選擇玩家的引導狀態
.empty-portal-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 5rem 2rem;
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
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    color: #f8fafc;
  }

  p {
    font-size: 0.95rem;
    color: #64748b;
    max-width: 450px;
    line-height: 1.6;
    margin: 0;
  }
}

.card-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #f8fafc;
  margin-top: 0;
  margin-bottom: 1.25rem;
}

.chart-card-header, .table-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  flex-shrink: 0;

  .card-title {
    margin-bottom: 0;
  }
}

.table-card-header {
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
}

/* PrimeVue Tabs 內部樣式穿透與深度自定義樣式 */
:deep(.p-tabs) {
  background: transparent !important;
  display: flex;
  flex-direction: column;
  height: 100%;
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
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:deep(.p-tabpanel) {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

// 動畫
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

// transition 動畫效果
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

// 日間模式適應樣式 (Day/Light Mode)
:root:not(.p-dark) {
  .admin-header {
    background: rgba(255, 255, 255, 0.7);
    border-color: rgba(15, 23, 42, 0.05);
    .admin-title {
      background: linear-gradient(135deg, #0f172a, #475569);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }

  .sidebar-panel, .tabs-card-wrapper {
    background: rgba(255, 255, 255, 0.7);
    border-color: rgba(15, 23, 42, 0.05);

    .panel-section-title {
      color: #64748b;
    }
  }

  .player-snapshot {
    .divider {
      background: rgba(15, 23, 42, 0.08);
    }
    .player-profile .profile-info {
      .profile-name {
        color: #0f172a;
      }
    }
    .mini-stat-card {
      background: rgba(15, 23, 42, 0.04);
      border-color: rgba(15, 23, 42, 0.05);
      .label {
        color: #64748b;
      }
    }
  }

  .empty-portal-state {
    background: rgba(255, 255, 255, 0.7);
    border-color: rgba(15, 23, 42, 0.05);
    h2 {
      color: #0f172a;
    }
  }

  .card-title {
    color: #0f172a;
  }
}
</style>