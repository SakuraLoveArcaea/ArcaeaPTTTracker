<script setup lang="ts">
// UIs
import { Button } from "primevue";
//
import { useToast } from "primevue/usetoast";
import { useAuthStore } from "../../stores/auth";
import { useRecordsStore } from "../../stores/records";
import { storeToRefs } from "pinia";
import { ConfirmActionDialog } from "../dialogs";
import { ref } from "vue";

// composable
const toast = useToast();
const store = useAuthStore();
const recordsStore = useRecordsStore();

// refs
const currentUser = storeToRefs(store).currentUser;
const { b30Avg, r10Avg, maxPtt } = storeToRefs(recordsStore);

const showLogoutDialog = ref(false);

// marco
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
    await store.signOut(toast);
    // 登出後做的事情：清除雲端紀錄，切換回本機資料
    recordsStore.initLoad();
    showLogoutDialog.value = false;
};
</script>

<template>
    <nav class="navbar">
        <h2>Arcaea PTT Tracker</h2>

        <div class="stats-container flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold">
            <div class="stat-box">
                B30 平均：<span class="text-primary text-lg" >{{ b30Avg.toFixed(4) }}</span>
            </div>
            <div class="stat-box">
                R10 平均：<span class="text-primary text-lg">{{ r10Avg.toFixed(4) }}</span>
            </div>
            <div class="stat-box">
                預估最高 PTT：<span class="text-primary text-lg">{{ maxPtt.toFixed(4) }}</span>
            </div>
        </div>

        <div class="right">
            <span>more</span>
            <div v-if="currentUser && !forceLogout" class="user-info">
                <span>{{ currentUser.displayName }}</span>
                <img
                    class="avatar"
                    v-if="currentUser.photoURL"
                    :src="currentUser.photoURL"
                    alt="User Avatar"
                />
                <Button label="登出" severity="danger" @click="requestLogout"/>
            </div>
            <div v-else class="user-login">
                <Button label="登入" severity="success" @click="store.signIn(toast)" />
            </div>
        </div>

        <!-- 登出確認 Dialog -->
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

<style scoped>
.navbar {
    width: 100vw;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    gap: 1rem;
}

/* 數據區塊容器 */
.stats-container {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap; /* 允許數據方塊換行 */
    gap: 8px;
}

.stats-container .stat-box {
    background: green; /* 如果您有設定 text-primary，這裡也可以改用主題色 */
    color: white;
    padding: 8px 12px;
    border-radius: 1rem;
    white-space: nowrap; /* 防止文字在方塊內斷行 */
}

/* 右側選單區塊 */
.right {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.user-info {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    height: auto; /* 移除固定高度，讓它自然延展 */
    gap: 1rem;
}

.avatar {
    width: 40px; /* 電腦版稍微縮小頭像會讓版面更精緻，可依喜好調整 */
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
}

/* =========================================
   響應式斷點 (Responsive Breakpoints)
   ========================================= */

/* 平板 (Tablet) - 螢幕寬度小於 1024px */
@media (max-width: 1024px) {
    .navbar {
        /* 將數據區塊推到第二行，讓標題和登入按鈕保持在第一行 */
        justify-content: space-between;
    }

    .stats-container {
        order: 3; /* 利用 order 改變視覺排列順序，移至最後 */
        width: 100%; /* 強制佔滿整行 */
        margin-top: 0.5rem;
    }

    h2 {
        order: 1;
    }

    .right {
        order: 2;
    }
}

/* 手機 (Mobile) - 螢幕寬度小於 768px */
@media (max-width: 768px) {
    .navbar {
        font-size: 10px;
        flex-direction: column; /* 改為垂直堆疊 */
        align-items: stretch;
    }

    h2 {
        text-align: center;
        margin-bottom: 0.5rem;
    }

    .right {
        order: 2;
        width: 100%;
        justify-content: center; /* 讓登入/登出按鈕置中 */
        margin-bottom: 0.5rem;
    }

    .stats-container {
        order: 3;
        width: 100%;
    }

    .stats-container .stat-box {
        text-align: center;
    }

    .user-info {
        flex-wrap: wrap;
        justify-content: center;
    }
}
</style>