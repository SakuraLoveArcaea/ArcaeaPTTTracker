<template>
    <router-view></router-view>
</template>

<script setup lang="ts">


import {onMounted, onUnmounted} from "vue";
import {onAuthStateChanged} from "firebase/auth";
import {auth} from "./firebase";
import { User } from "firebase/auth";
import {useAuthStore} from "./stores/authStore";
import {storeToRefs} from "pinia";
import {useRecordsStore} from "./stores/recordsStore";
import TableView from "@/components/table/TableView.vue";
import HomeView from "@/views/HomeView.vue";


// composable
const recordsStore = useRecordsStore();

const { records, isLoading } = storeToRefs(recordsStore);
const { isDeleteDialogOpen, isAddDialogOpen, recordToDelete } = storeToRefs(recordsStore)
const { addRecord, updateRecord, deleteRecord, onAddRecordForm } = recordsStore



const onKeyDown = (e: KeyboardEvent) => {
    if (e.metaKey && e.code === 'KeyK') {
        e.preventDefault();
        console.log("K")
        isAddDialogOpen.value = true;
    }
}

const handleSave = (form: any) => {
    onAddRecordForm(form)
    isAddDialogOpen.value = false;
}


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

onMounted(() => {
    window.addEventListener('keydown', onKeyDown);
});

onUnmounted(() => {
    window.removeEventListener('keydown', onKeyDown);
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