<template>
    <Toast />
<!--    <Search />-->
<!--    <LogBaseUpdateView />-->
    <NavBar style="position: sticky; left: 0; top: 0; z-index: 3"/>
<!--    <NavBar force-logout/>-->
<!--        <Table />-->
    <TableView />

</template>

<script setup lang="ts">
import Table from './components/table/Table.vue';
import Toast from 'primevue/toast';
import { useToast } from "primevue/usetoast";
import NavBar from "./components/navbar/NavBar.vue";
import {onMounted} from "vue";
import {onAuthStateChanged} from "firebase/auth";
import {auth} from "./firebase.js";
import { User } from "firebase/auth";
import {useAuthStore} from "./stores/auth";
import Search from "./components/Search.vue";
import TableView from "./components/table/TableView.vue";
import RecordsActions from "./components/table/recordActions/RecordsActions.vue";
import RecordsTable from "./components/table/recordTable/RecordsTable.vue";
import LogBaseUpdateView from "./components/admin/logBaseUpdateView.vue";

// composable
const toast = useToast();
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

#app {
    width: 100%;
    margin: 0;
    padding: 0;
}





</style>