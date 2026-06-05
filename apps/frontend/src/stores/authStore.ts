import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { GoogleAuthProvider, signInWithPopup, type User } from 'firebase/auth';
import { auth } from "../firebase";
import { signOut as _signOut } from "firebase/auth";

export const useAuthStore = defineStore('auth', () => {
    // 1. States
    const currentUser = ref<User | null>(null);
    const token = ref<string | null>(null);

    // 2. Getters
    const isLoggedIn = computed(() => !!currentUser.value);

    // 3. Actions
    const signIn = async (toast: any) => {
        try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({
                prompt: 'select_account'
            });
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            currentUser.value = user;
            token.value = (user as any).accessToken || null;
            toast.add({ severity: 'success', summary: '登入成功', detail: `歡迎 ${user.displayName}！`, life: 2000 });
        } catch (error: any) {
            toast.add({ severity: 'error', summary: '登入失敗', detail: error.message, life: 3000 });
        }
    };

    const signOut = async (toast: any) => {
        try {
            await _signOut(auth);
            currentUser.value = null;
            token.value = null;
            toast.add({ severity: 'info', summary: '已登出', detail: '已切換至訪客模式', life: 2000 });
        } catch (error: any) {
            toast.add({ severity: 'error', summary: '登出失敗', detail: error.message, life: 3000 });
        }
    };

    const setCurrentUser = (user: User | null) => {
        if (user) {
            currentUser.value = user;
            token.value = (user as any).accessToken || null;
        } else {
            currentUser.value = null;
            token.value = null;
        }
    };

    return { currentUser, token, isLoggedIn, setCurrentUser, signIn, signOut };
});