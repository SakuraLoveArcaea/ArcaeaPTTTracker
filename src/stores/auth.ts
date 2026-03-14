import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {GoogleAuthProvider, signInWithPopup, User} from 'firebase/auth'

import {auth} from "../firebase";
import {signOut as _signOut} from "firebase/auth";

export const useAuthStore = defineStore('auth', () => {
    // 1. State: 存放登入資訊
    const currentUser = ref<User | null>(null)
    const token = ref(null)

    // 2. Getters: 計算屬性 (例如判斷是否已登入)
    const isLoggedIn = computed(() => !!currentUser.value)

    // 3. Actions: 修改狀態的方法 (處理 Google 登入邏輯)
    const signIn = async (toast) => {
        try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters(
                {
                    prompt: 'select_account'
                }
            )
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            currentUser.value = user
            toast.add({ severity: 'success', summary: '登入成功', detail: `歡迎 ${user.displayName}！`, life: 2000 });
        } catch (error: any) {
            toast.add({ severity: 'error', summary: '登入失敗', detail: error.message, life: 3000 });
        }
    }
    const signOut = async (toast) => {
        try {
            await _signOut(auth);
            currentUser.value = null
            toast.add({severity: 'info', summary: '已登出', detail: '已切換至訪客模式', life: 2000});
        } catch (error: any) {
            toast.add({severity: 'error', summary: '登出失敗', detail: error.message, life: 3000});
        }
    }

    function setCurrentUser(user) {
        if (user) {
            currentUser.value = user
            token.value = user.accessToken || null
        } else {
            currentUser.value = null
            token.value = null
        }
    }

    return { currentUser, token, isLoggedIn, setCurrentUser, signIn, signOut }
})