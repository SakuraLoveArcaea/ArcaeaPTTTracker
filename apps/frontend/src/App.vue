<template>
    <router-view></router-view>
</template>

<script setup lang="ts">


import { onMounted } from "vue";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@tracker/shared/firebase";
import { User } from "firebase/auth";
import { useAuthStore } from "@tracker/shared/stores/authStore";

const store = useAuthStore();

onMounted(() => {
    onAuthStateChanged(auth, async (user: User | null) => {
        if (user) {
            store.setCurrentUser(user);
        } else {
            store.setCurrentUser(null);
        }
    });
});
</script>

<style>
html, body {
    margin: 0;
    padding: 0;
    width: 100%;
}

#home {
    width: 100%;
    margin: 0;
    padding: 0;
}





</style>