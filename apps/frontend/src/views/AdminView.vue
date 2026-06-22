<template>
    <Toast />
    <ConfirmDialog />
    <div class="admin-dashboard-wrapper">
        <!-- 頂部管理導覽列 (Admin NavBar) -->
        <AdminNavBar :selectedUserId="selectedUserId" :userRecords="userRecords" />

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

                <!-- Tabs Card Wrapper (以元件包裝) -->
                <AdminTabs
                    v-else
                    :records="userRecords"
                    :isLoading="loading"
                />
            </transition>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import ConfirmDialog from 'primevue/confirmdialog';
import Toast from 'primevue/toast';
import Select from 'primevue/select';
import AdminNavBar from '@/components/navbar/AdminNavBar.vue';
import AdminTabs from '@/components/dashboard/AdminTabs.vue';
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

// 元件掛載時，先獲取所有玩家並主題
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

@media (max-width: 768px) {
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
  .selector-banner {
    background: rgba(59, 130, 246, 0.05);
    .selector-hint-text {
      color: #475569;
    }
  }

  .empty-portal-state {
    background: rgba(255, 255, 255, 0.7);
    border-color: rgba(15, 23, 42, 0.05);
  }

  .empty-portal-state h2 {
    color: #0f172a;
  }
}
</style>