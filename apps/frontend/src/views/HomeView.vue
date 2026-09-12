<template>
    <Toast position="top-right">
        <template #message="{ message }">
            <div 
                class="toast-message-body" 
                :class="{ 'clickable': !!message.data?.recordId }"
                @click="handleToastClick(message)"
            >
                <span :class="[getToastIcon(message.severity), 'p-toast-message-icon']" />
                <div class="toast-text-group">
                    <span class="p-toast-summary">{{ message.summary }}</span>
                    <div class="p-toast-detail">{{ message.detail }}</div>
                    <div v-if="message.data?.recordId" class="toast-click-hint">
                        <i class="pi pi-arrow-right"></i>
                        <span>點擊跳轉至成績卡片</span>
                    </div>
                </div>
            </div>
        </template>
    </Toast>
    <ConfirmDialog />
    <div class="home-dashboard-wrapper">
        <!-- 頂部導覽列 -->
        <header class="navbar-wrapper">
            <NavBar />
        </header>

        <!-- 主要 Dashboard 內容 -->
        <div class="dashboard-content-grid">
            <HomeTabs />
        </div>
    </div>
    
    <!-- 新增成績 Dialog -->
    <AddRecordDialog ref="addRecordDialogRef" v-model:visible="isAddDialogOpen" @save="handleSave"/>
    
    <!-- 專屬手機分數鍵盤 Dialog -->
    <ScoreInputDialog @save="handleScoreSave" />

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
import HomeTabs from "@/components/dashboard/HomeTabs.vue";
import { AddRecordDialog, ScoreInputDialog } from "@tracker/shared/components/dialogs";
import Button from 'primevue/button';
import { useRecordsStore } from "@tracker/shared/stores/recordsStore";
import { storeToRefs } from "pinia";
import { onMounted, onUnmounted, ref, watch } from "vue";
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';
import { useUIStore } from "@tracker/shared/stores/uiStore";

const recordsStore = useRecordsStore();
const UIStore = useUIStore();

const { isAddDialogOpen } = storeToRefs(UIStore)
const { onAddRecordForm } = recordsStore

const addRecordDialogRef = ref<any>(null);
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

const handleScoreSave = (payload: { id: string, score: number }) => {
    if (payload.id === 'temp-add-record') {
        if (addRecordDialogRef.value) {
            addRecordDialogRef.value.setScore(payload.score);
        }
        return;
    }
    const oldRecord = recordsStore.records.find(r => r.id === payload.id);
    if (oldRecord) {
        recordsStore.onAddRecordForm({
            id: payload.id,
            title: oldRecord.title,
            difficulty: oldRecord.difficulty,
            constant: oldRecord.constant,
            score: payload.score,
            autoUpdate: oldRecord.autoUpdate
        });
    }
}

const handleToastClick = (message: any) => {
    if (message?.data?.recordId) {
        UIStore.jumpToRecord(message.data.recordId);
    }
};

const getToastIcon = (severity?: string) => {
    switch (severity) {
        case 'success':
            return 'pi pi-check-circle';
        case 'info':
            return 'pi pi-info-circle';
        case 'warn':
            return 'pi pi-exclamation-triangle';
        case 'error':
            return 'pi pi-times-circle';
        default:
            return 'pi pi-info-circle';
    }
};

onMounted(() => {
    UIStore.initTheme();
    UIStore.activeTab = 'table'; // 進入頁面預設在成績表格 Tab
    window.addEventListener('keydown', onKeyDown);
})

onUnmounted(() => {
    window.removeEventListener('keydown', onKeyDown);
});
</script>

<style scoped lang="scss">
:deep(.p-toast-message) {
  .toast-message-body {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    width: 100%;

    &.clickable {
      cursor: pointer;
      user-select: none;
      transition: transform 0.15s ease, opacity 0.15s ease;

      &:hover {
        transform: translateX(-3px);
        opacity: 0.95;
      }
    }

    .toast-text-group {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      flex: 1;
    }

    .toast-click-hint {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--p-primary-color, #3b82f6);
      margin-top: 0.35rem;
      background: rgba(59, 130, 246, 0.12);
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      width: fit-content;

      i {
        font-size: 0.7rem;
        transition: transform 0.2s ease;
      }
    }

    &.clickable:hover .toast-click-hint i {
      transform: translateX(2px);
    }
  }
}

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