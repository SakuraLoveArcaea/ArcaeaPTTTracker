<template>
    <Toast />
    <Table />
</template>

<script setup>
import Table from './Table.vue';
import Toast from 'primevue/toast';

import { useToast } from "primevue/usetoast";
const toast = useToast();

const testToast = () => {
    console.log("按鈕被點擊了");
    toast.add({ severity: 'info', summary: '測試', detail: '如果你看到我，代表設定成功！', life: 3000 });
};

</script>

<style>
</style>