<template>
        <AdminView />
</template>

<script setup lang="ts">
import {onMounted, onUnmounted} from "vue";
import {onAuthStateChanged} from "firebase/auth";
import {auth} from "./firebase";
import { User } from "firebase/auth";
import {useAuthStore} from "./stores/authStore";
import {storeToRefs} from "pinia";
import {useRecordsStore} from "./stores/recordsStore";
import AdminView from "@/views/AdminView.vue";


// composable
const recordsStore = useRecordsStore();

const { records, isLoading } = storeToRefs(recordsStore);
const { isDeleteDialogOpen, isAddDialogOpen, recordToDelete } = storeToRefs(recordsStore)
const { addRecord, updateRecord, deleteRecord, onAddRecordForm } = recordsStore






// composable
const store = useAuthStore();


// hook
onMounted(() => {
    onAuthStateChanged(auth, async (user: User | null) => {
        if (user) {
            store.setCurrentUser(user);
        } else {
            store.setCurrentUser(null);
        }
    })
})


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