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
            <div class="user-profile" @click="toggleUserMenu" aria-haspopup="true" aria-controls="user_menu" title="點擊開啟選單">
                <Avatar
                    v-if="currentUser && !forceLogout && currentUser.photoURL"
                    :image="currentUser.photoURL"
                    shape="circle"
                    class="avatar clickable-avatar"
                />
                <Avatar
                    v-else
                    icon="pi pi-user"
                    shape="circle"
                    class="avatar-placeholder clickable-avatar"
                />
                <span class="username" v-if="currentUser && !forceLogout">{{ currentUser.displayName }}</span>
                <span class="username" v-else>訪客</span>
                <i class="pi pi-angle-down menu-arrow"></i>
            </div>
            <Menu ref="userMenu" id="user_menu" :model="userMenuItems" :popup="true" />
        </div>

        <!-- 個人設定對話框 -->
        <UserSettingsDialog v-model:visible="showSettingsDialog" />
    </nav>
</template>

<script setup lang="ts">
import { Button } from "primevue";
import Avatar from "primevue/avatar";
import Menu from "primevue/menu";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import { useAuthStore } from "@/stores/authStore";
import { useRecordsStore } from "@/stores/recordsStore";
import { storeToRefs } from "pinia";
import UserSettingsDialog from '@/components/dialogs/UserSettingsDialog.vue';
import { ref, computed } from "vue";
import { useUIStore } from "@/stores/uiStore";

const props = defineProps({
    'forceLogout': {
        type: Boolean,
        default: false
    }
});

const toast = useToast();
const confirm = useConfirm();
const authStore = useAuthStore();
const recordsStore = useRecordsStore();
const UIStore = useUIStore();

const { currentUser } = storeToRefs(authStore);
const { b30Avg, r10Avg, maxPtt } = storeToRefs(recordsStore);

const showSettingsDialog = ref(false);
const userMenu = ref();

// 響應式使用者選單項目
const userMenuItems = computed(() => {
    const items = [
        {
            label: '個人設定',
            icon: 'pi pi-cog',
            command: () => {
                showSettingsDialog.value = true;
            }
        }
    ];

    if (currentUser.value && !props.forceLogout) {
        items.push(
            { separator: true } as any,
            {
                label: '登出',
                icon: 'pi pi-sign-out',
                class: 'logout-menu-item',
                command: () => {
                    requestLogout();
                }
            }
        );
    } else {
        items.push(
            { separator: true } as any,
            {
                label: 'Google 登入',
                icon: 'pi pi-google',
                class: 'login-menu-item',
                command: () => {
                    authStore.signIn(toast);
                }
            }
        );
    }

    return items;
});

const toggleUserMenu = (event: Event) => {
    userMenu.value.toggle(event);
};

const requestLogout = () => {
    confirm.require({
        message: '您確定要登出嗎？登出後將切換為本機暫存模式，不會顯示您的雲端成績。',
        header: '確認登出',
        icon: 'pi pi-exclamation-triangle',
        rejectProps: { label: '取消', outlined: true, severity: 'secondary' },
        acceptProps: { label: '確認登出', severity: 'danger' },
        accept: () => {
            executeLogout();
        }
    });
};

const executeLogout = async () => {
    await authStore.signOut(toast);
    recordsStore.initLoad();
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

  .user-profile {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    padding: 0.35rem 0.65rem;
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: all 0.25s ease;
    user-select: none;
    -webkit-tap-highlight-color: transparent;

    &:hover {
      background: rgba(255, 255, 255, 0.07);
      border-color: rgba(255, 255, 255, 0.1);
    }

    .avatar, .avatar-placeholder {
      width: 28px !important;
      height: 28px !important;
      border-radius: 50%;
      font-size: 0.8rem;
      flex-shrink: 0;
    }

    .username {
      font-size: 0.85rem;
      font-weight: 600;
      color: #cbd5e1;
      max-width: 100px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .menu-arrow {
      font-size: 0.75rem;
      color: #94a3b8;
    }
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
  .navbar-user .user-profile {
    padding: 0.2rem;
    background: transparent !important;
    border: none !important;

    .username, .menu-arrow {
      display: none !important;
    }
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

  .navbar-user .user-profile {
    background: rgba(15, 23, 42, 0.03);
    border-color: rgba(15, 23, 42, 0.05);

    &:hover {
      background: rgba(15, 23, 42, 0.06);
      border-color: rgba(15, 23, 42, 0.08);
    }

    .username {
      color: #334155;
    }
  }
}

// 個人設定對話框樣式
.settings-container-dialog {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.5rem 0;
}

.settings-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  width: 100%;
}

.settings-label {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-color);

  .settings-icon {
    color: #3b82f6;
    font-size: 1.05rem;
  }
}
</style>