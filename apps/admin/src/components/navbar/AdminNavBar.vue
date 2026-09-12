<template>
    <header class="admin-navbar-wrapper">
        <nav class="admin-navbar glass-panel">
            <!-- 左側：標題與 LOGO -->
            <NavBrand
                icon="pi-shield"
                desktopTitle="Arcaea 管理後台"
                mobileTitle="管理後台"
            />

            <!-- 中間：選取玩家的數據看板 (玻璃膠囊，同 Home NavBar) -->
            <NavStats
                :b30Avg="userB30Avg"
                :r10Avg="userR10Avg"
                :maxPtt="userMaxPtt"
                :isAdmin="true"
                :pttMode="pttMode"
                :showEmpty="!selectedUserId || userRecords.length === 0"
            />

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
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';
import NavBrand from '@tracker/shared/components/navbar/NavBrand.vue';
import NavStats from '@tracker/shared/components/navbar/NavStats.vue';
import { useUIStore } from '@tracker/shared/stores/uiStore';
import { getPttStrategy } from '@tracker/shared/utils/pttStrategy';
import { storeToRefs } from 'pinia';

const UIStore = useUIStore();
const { pttMode } = storeToRefs(UIStore);

const props = defineProps({
    selectedUserId: {
        type: String as PropType<string | null>,
        default: null
    },
    userRecords: {
        type: Array as PropType<any[]>,
        default: () => []
    }
});

// 依當前策略計算該玩家的整體 PTT
const userB30Avg = computed(() => {
    const strategy = getPttStrategy(UIStore.pttMode);
    return strategy.calcOverallPtt(props.userRecords || []).mainAvg;
});

const userR10Avg = computed(() => {
    const strategy = getPttStrategy(UIStore.pttMode);
    return strategy.calcOverallPtt(props.userRecords || []).subAvg;
});

const userMaxPtt = computed(() => {
    const strategy = getPttStrategy(UIStore.pttMode);
    return strategy.calcOverallPtt(props.userRecords || []).overall;
});
</script>

<style scoped lang="scss">
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

// 響應式佈局重新設計 (手機版與平板)
@media (max-width: 1024px) {
  .admin-navbar {
    display: grid !important;
    grid-template-columns: 1fr auto !important;
    grid-template-rows: auto auto !important;
    gap: 0.5rem;
    padding: 0.65rem 0.85rem;
  }

  .navbar-status {
    grid-column: 2 !important;
    grid-row: 1 !important;
    justify-content: flex-end;
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
}

// 日間模式適應樣式 (Day/Light Mode)
:root:not(.p-dark) {
  .admin-navbar {
    background: rgba(255, 255, 255, 0.7);
    border-color: rgba(15, 23, 42, 0.05);
  }
}
</style>
