<template>
    <Toast />
    <NavBar style="position: sticky; left: 0; top: 0; z-index: 3"/>
    <TableView />
    <AddRecordDialog v-model:visible="isAddDialogOpen" @save="handleSave"/>
</template>

<script setup lang="ts">


// composable
import NavBar from "@/components/navbar/NavBar.vue";
import TableView from "@/components/table/TableView.vue";
import AddRecordDialog from "@/components/table/recordActions/AddRecordDialog.vue";
import { useAuthStore } from "@/stores/authStore";
import { auth } from "@/firebase";
import { useRecordsStore } from "@/stores/recordsStore";
import { onAuthStateChanged } from "firebase/auth";
import { storeToRefs } from "pinia";
import { onMounted, onUnmounted } from "vue";
import { User } from "firebase/auth";
import Toast from 'primevue/toast';


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