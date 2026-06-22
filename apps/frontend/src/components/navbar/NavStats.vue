<template>
    <div class="stats-container" v-if="!showEmpty">
        <div class="stat-box b30" :title="isAdmin ? '該玩家 Best 30 最佳成績平均潛力值' : '您的 Best 30 (最佳 30 次成績) 平均潛力值'">
            <i class="pi pi-star-fill stat-icon"></i>
            <span class="label">
                <span class="desktop-label">B30 平均：</span>
                <span class="mobile-label">B30:</span>
            </span>
            <span class="value">{{ b30Avg.toFixed(4) }}</span>
        </div>
        <div class="stat-box r10" :title="isAdmin ? '該玩家最高單曲前 10 次成績平均值' : '您的最高單曲前 10 次成績平均值 (預估最高)'">
            <i class="pi pi-bolt stat-icon"></i>
            <span class="label">
                <span class="desktop-label">最高 R10 平均：</span>
                <span class="mobile-label">R10:</span>
            </span>
            <span class="value">{{ r10Avg.toFixed(4) }}</span>
        </div>
        <div class="stat-box max-ptt" :title="isAdmin ? '該玩家預估理論最高潛力值' : '當您 Recent 10 遊玩皆能發揮極限時，所能達到的理論最高潛力值'">
            <i class="pi pi-chart-line stat-icon"></i>
            <span class="label">
                <span class="desktop-label">預估最高 PTT：</span>
                <span class="mobile-label">最高:</span>
            </span>
            <span class="value">{{ maxPtt.toFixed(4) }}</span>
        </div>
    </div>
    <div class="stats-container-empty" v-else>
        <span class="empty-stats-label">
            <i class="pi pi-users"></i>
            <span class="desktop-label">請選取一位玩家以同步載入數據看板</span>
            <span class="mobile-label">請先選取一位玩家</span>
        </span>
    </div>
</template>

<script setup lang="ts">
defineProps({
    b30Avg: {
        type: Number,
        default: 0
    },
    r10Avg: {
        type: Number,
        default: 0
    },
    maxPtt: {
        type: Number,
        default: 0
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    showEmpty: {
        type: Boolean,
        default: false
    }
});
</script>

<style scoped lang="scss">
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

// 響應式佈局重新設計 (手機版利用 Grid 將 stats-container 定位在下方)
@media (max-width: 1024px) {
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

// 日間模式適應樣式 (Day/Light Mode)
:root:not(.p-dark) {
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
}
</style>
