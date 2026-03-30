<template>
    <Toast />
<!--    <Search />-->
<!--    <LogBaseUpdateView />-->
    <NavBar style="position: sticky; left: 0; top: 0; z-index: 3"/>
<!--    <NavBar force-logout/>-->
<!--        <Table />-->
    <TableView />
    <AddRecordDialog v-model:visible="isAddDialogOpen" @save="handleSave"/>

</template>

<script setup lang="ts">
import Table from './components/table/Table.vue';
import Toast from 'primevue/toast';
import { useToast } from "primevue/usetoast";
import NavBar from "./components/navbar/NavBar.vue";
import {onMounted, onUnmounted} from "vue";
import {onAuthStateChanged} from "firebase/auth";
import {auth} from "./firebase.js";
import { User } from "firebase/auth";
import {useAuthStore} from "./stores/authStore";
import Search from "./components/Search.vue";
import TableView from "./components/table/TableView.vue";
import RecordsActions from "./components/table/recordActions/RecordsActions.vue";
import RecordsTable from "./components/table/recordTable/RecordsTable.vue";
import LogBaseUpdateView from "./components/admin/logBaseUpdateView.vue";
import AddRecordDialog from "./components/table/recordActions/AddRecordDialog.vue";
import {storeToRefs} from "pinia";
import {useRecordsStore} from "./stores/recordsStore";

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

#app {
    width: 100%;
    margin: 0;
    padding: 0;
}





</style>