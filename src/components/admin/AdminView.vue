<template>
    <div class="p-6">
        <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center mb-4 gap-3">
            <h1 class="text-2xl font-bold m-0">全伺服器成績管理 (Admin)</h1>

            <div class="flex align-items-center gap-2">
                <span class="font-semibold">篩選玩家:</span>
                <Select
                    v-model="selectedUserId"
                    :options="userOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="全部玩家"
                    showClear
                    class="w-full md:w-14rem"
                />
            </div>
        </div>

        <RecordsTable
            :records="filteredRecords"
            :isLoading="loading"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import Select from 'primevue/select'; // 確保有匯入 Select
import RecordsTable from '../table/recordTable/RecordsTable.vue';

const allUserRecords = ref([]);
const loading = ref(true);
const selectedUserId = ref(null); // 當前選中的玩家 ID

// 1. 取得原始資料
const fetchAllRecords = async () => {
    loading.value = true;
    try {
        const response = await fetch('http://localhost:3000/api/all-records');
        allUserRecords.value = await response.json();
    } catch (error) {
        console.error("獲取資料失敗:", error);
    } finally {
        loading.value = false;
    }
};

// 2. 產生下拉選單的選項 (從資料中提取唯一的 userId)
const userOptions = computed(() => {
    // 取得所有不重複的 userId
    const uids = [...new Set(allUserRecords.value.map(r => r.userId))].filter(Boolean);
    return uids.map(uid => ({
        label: `玩家: ${uid.substring(0, 8)}...`,
        value: uid
    }));
});

// 3. 根據下拉選單結果篩選表格內容
const filteredRecords = computed(() => {
    if (!selectedUserId.value) return allUserRecords.value;
    return allUserRecords.value.filter(r => r.userId === selectedUserId.value);
});


const handleAdminUpdate = async ({ updatedData, onSuccess, onError }) => {
// 這裡呼叫你的 Server API 進行跨用戶修改
    console.log('管理員正在修改資料:', updatedData);
    onSuccess();
};

const handleAdminDelete = async ({ record, onSuccess, onError }) => {
    console.log('管理員正在刪除資料:', record);
    onSuccess();
}

onMounted(fetchAllRecords);
</script>

<style scoped>
/* 配合 PrimeFlex 或自定義樣式 */
.gap-3 { gap: 1rem; }
.gap-2 { gap: 0.5rem; }
</style>
