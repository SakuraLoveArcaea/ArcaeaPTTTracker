<template>
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
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import Avatar from 'primevue/avatar';
import Menu from 'primevue/menu';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { useAuthStore } from '@/stores/authStore';
import { useRecordsStore } from '@/stores/recordsStore';
import { storeToRefs } from 'pinia';
import UserSettingsDialog from '@/components/dialogs/UserSettingsDialog.vue';

const props = defineProps({
    forceLogout: {
        type: Boolean,
        default: false
    }
});

const toast = useToast();
const confirm = useConfirm();
const authStore = useAuthStore();
const recordsStore = useRecordsStore();

const { currentUser } = storeToRefs(authStore);

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
        },
        {
            label: '使用教學',
            icon: 'pi pi-question-circle',
            command: () => {
                // 預留位置，什麼都不要做
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

// 響應式佈局重新設計
@media (max-width: 1024px) {
  .navbar-user {
    grid-column: 2 !important;
    grid-row: 1 !important;
    justify-content: flex-end;
  }
}

@media (max-width: 768px) {
  .navbar-user .user-profile {
    padding: 0.2rem;
    background: transparent !important;
    border: none !important;

    .username, .menu-arrow {
      display: none !important;
    }
  }
}

// 日間模式適應樣式 (Day/Light Mode)
:root:not(.p-dark) {
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
</style>
