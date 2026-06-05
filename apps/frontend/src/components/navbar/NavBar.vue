<template>
    <nav class="navbar glass-panel">
        <!-- 左側：標題與 LOGO -->
        <div class="navbar-brand">
            <i class="pi pi-compass brand-icon"></i>
            <h2 class="brand-title">
                <span class="desktop-title">Arcaea PTT Tracker</span>
                <span class="mobile-title">Arcaea PTT</span>
            </h2>
        </div>

        <!-- 中間：核心指標看板 (玻璃質感膠囊) -->
        <div class="stats-container">
            <div class="stat-box b30" title="您的 Best 30 (最佳 30 次成績) 平均潛力值">
                <i class="pi pi-star-fill stat-icon"></i>
                <span class="label">
                    <span class="desktop-label">B30 平均：</span>
                    <span class="mobile-label">B30:</span>
                </span>
                <span class="value">{{ b30Avg.toFixed(4) }}</span>
            </div>
            <div class="stat-box r10" title="您的最高單曲前 10 次成績平均值 (預估最高)">
                <i class="pi pi-bolt stat-icon"></i>
                <span class="label">
                    <span class="desktop-label">最高 R10 平均：</span>
                    <span class="mobile-label">R10:</span>
                </span>
                <span class="value">{{ r10Avg.toFixed(4) }}</span>
            </div>
            <div class="stat-box max-ptt" title="當您 Recent 10 遊玩皆能發揮極限時，所能達到的理論最高潛力值">
                <i class="pi pi-chart-line stat-icon"></i>
                <span class="label">
                    <span class="desktop-label">預估最高 PTT：</span>
                    <span class="mobile-label">最高:</span>
                </span>
                <span class="value">{{ maxPtt.toFixed(4) }}</span>
            </div>
        </div>

        <!-- 右側：使用者選單 -->
        <div class="navbar-user">
            <!-- 主題切換按鈕 -->
            <Button
                :icon="isDarkTheme ? 'pi pi-sun' : 'pi pi-moon'"
                outlined
                severity="secondary"
                size="small"
                @click="UIStore.toggleTheme"
                class="theme-toggle-btn"
                :title="isDarkTheme ? '切換至日間模式' : '切換至夜間模式'"
            />
            <div v-if="currentUser && !forceLogout" class="user-profile">
                <Avatar
                    v-if="currentUser.photoURL"
                    :image="currentUser.photoURL"
                    shape="circle"
                    class="avatar"
                />
                <Avatar
                    v-else
                    icon="pi pi-user"
                    shape="circle"
                    class="avatar-placeholder"
                />
                <span class="username">{{ currentUser.displayName }}</span>
                <Button label="登出" severity="danger" size="small" outlined @click="requestLogout" class="logout-btn"/>
            </div>
            <div v-else class="user-login">
                <Button label="Google 登入" icon="pi pi-google" severity="success" size="small" @click="authStore.signIn(toast)" class="login-btn" />
            </div>
        </div>

        <!-- 登出確認彈窗 -->
        <ConfirmActionDialog 
            v-model:visible="showLogoutDialog" 
            header="確認登出" 
            message="您確定要登出嗎？登出後將切換為本機暫存模式，不會顯示您的雲端成績。"
            severity="danger"
            acceptLabel="確認登出"
            cancelLabel="取消"
            @accept="executeLogout" 
            @cancel="showLogoutDialog = false"
        />
    </nav>
</template>

<script setup lang="ts">
import { Button } from "primevue";
import Avatar from "primevue/avatar";
import { useToast } from "primevue/usetoast";
import { useAuthStore } from "@/stores/authStore";
import { useRecordsStore } from "@/stores/recordsStore";
import { storeToRefs } from "pinia";
import ConfirmActionDialog from '@/components/dialogs/ConfirmActionDialog.vue';
import { ref } from "vue";
import { useUIStore } from "@/stores/uiStore";

const toast = useToast();
const authStore = useAuthStore();
const recordsStore = useRecordsStore();
const UIStore = useUIStore();

const { currentUser } = storeToRefs(authStore);
const { b30Avg, r10Avg, maxPtt } = storeToRefs(recordsStore);
const { isDarkTheme } = storeToRefs(UIStore);

const showLogoutDialog = ref(false);

defineProps({
    'forceLogout': {
        type: Boolean,
        default: false
    }
});

const requestLogout = () => {
    showLogoutDialog.value = true;
};

const executeLogout = async () => {
    await authStore.signOut(toast);
    recordsStore.initLoad();
    showLogoutDialog.value = false;
};
</script>

<style scoped lang="scss">
.navbar {
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

// 響應式標題控制
.mobile-title {
  display: none;
}
.desktop-title {
  display: inline;
}

// 中間指標看版
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

    // 依據不同數據渲染不同色彩發光效果
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

// 使用者頭像與狀態
.navbar-user {
  display: flex;
  align-items: center;
  gap: 0.75rem;

  .theme-toggle-btn {
    border-radius: 50% !important;
    width: 32px !important;
    height: 32px !important;
    padding: 0 !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    flex-shrink: 0;
  }

  .user-profile {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .avatar-placeholder {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.05);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .username {
      font-size: 0.85rem;
      font-weight: 600;
      color: #cbd5e1;
    }

    .logout-btn {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
    }
  }

  .login-btn {
    border-radius: 6px;
  }
}

// 響應式佈局重新設計 (手機版利用 Grid 將 stats-container 定位在下方)
@media (max-width: 1024px) {
  .navbar {
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

  .navbar-user {
    grid-column: 2 !important;
    grid-row: 1 !important;
    justify-content: flex-end;
  }

  // 手機版隱藏冗長文字
  .desktop-title {
    display: none;
  }
  .mobile-title {
    display: inline;
  }

  // 指標看板手機版精簡化
  .stats-container {
    grid-column: span 2 !important;
    grid-row: 2 !important;
    width: 100%;
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: nowrap !important; // 強制不換行，無論如何都在同一列
    justify-content: space-between !important; // 均勻分佈
    gap: 0.2rem !important;
    border-top: 1px solid var(--border-color);
    padding-top: 0.45rem;
    margin-top: 0.1rem;

    .stat-box {
      background: transparent !important;
      border: none !important;
      padding: 0 !important;
      font-size: 0.72rem !important; // 微調字體大小，確保在超窄螢幕上仍能完美容納
      gap: 0.15rem !important; // 緊湊間距
      transform: none !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      display: inline-flex !important;
      align-items: center !important;
      white-space: nowrap !important; // 單個指標內部不換行
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
}

@media (max-width: 768px) {
  .navbar {
    padding: 0.5rem 0.75rem;
  }
  .navbar-user .user-profile .username {
    display: none; // 手機螢幕更小時，隱藏使用者暱稱以防擠壓
  }
}

:root:not(.p-dark) {
  .navbar {
    background: rgba(255, 255, 255, 0.7);
    border-color: rgba(15, 23, 42, 0.05);
  }

  .navbar-brand .brand-title {
    background: linear-gradient(135deg, #0f172a, #475569);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .stats-container .stat-box {
    background: rgba(255, 255, 255, 0.9);
    border-color: rgba(15, 23, 42, 0.05);

    .label {
      color: #64748b;
    }
  }

  // 手機版無框指標，日間模式文字顏色微調
  @media (max-width: 1024px) {
    .stats-container .stat-box {
      background: transparent !important;
      border: none !important;
    }
  }

  .navbar-user .user-profile .username {
    color: #334155;
  }
}
</style>