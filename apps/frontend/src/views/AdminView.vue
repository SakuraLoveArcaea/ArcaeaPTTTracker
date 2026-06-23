<template>
    <div class="p-6">
        <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center mb-4 gap-3">
            <h1 class="text-2xl font-bold m-0">使用者成績管理 (Admin)</h1>

            <div class="flex align-items-center gap-2">
                <span class="font-semibold">選擇玩家:</span>
                <Select
                    v-model="selectedUserId"
                    :options="userOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="請選擇一位玩家"
                    showClear
                    class="w-full md:w-14rem"
                />
            </div>
        </div>

        <div v-if="!selectedUserId" class="text-center p-5 text-gray-500 border-round surface-100">
            請從上方選單選擇一位玩家以顯示其成績紀錄。
        </div>

        <RecordsTable
            v-else
            :records="userRecords"
            :isLoading="loading"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import Select from 'primevue/select';
import RecordsTable from '../components/table/recordTable/RecordsTable.vue';

const users = ref<any[]>([]); // 儲存所有使用者清單
const userRecords = ref<any[]>([]); // 儲存當前選中玩家的成績
const loading = ref(false);
const selectedUserId = ref<string | null>(null);

// 1. 取得使用者列表 (初始化時呼叫)
const fetchUsers = async () => {
    try {
        const response = await fetch('http://localhost:3000/api/users');
        users.value = await response.json();
    } catch (error) {
        console.error("獲取玩家列表失敗:", error);
    }
};

// 2. 將使用者資料轉換成下拉選單選項
const userOptions = computed(() => {
    return users.value.map(user => ({
        // 如果你的 user 資料裡面有暱稱(例如 displayName)，可以改成 `${user.displayName} (${user.uid...})`
        label: `玩家: ${String(user.uid).substring(0, 8)}...`,
        value: user.uid
    }));
});

// 3. 取得特定玩家的成績 (當選擇改變時呼叫)
const fetchUserRecords = async (newUserId: string | null) => {
    // 如果清空選擇，就清空目前紀錄並提早結束
    if (!newUserId) {
        userRecords.value = [];
        return;
    }

    loading.value = true;
    try {
        const response = await fetch(`http://localhost:3000/api/users/${newUserId}/records`);
        userRecords.value = await response.json();
    } catch (error) {
        console.error("獲取玩家成績失敗:", error);
    } finally {
        loading.value = false;
    }
};

// 監聽下拉選單變化，自動觸發資料獲取
watch(selectedUserId, (newValue) => {
    fetchUserRecords(newValue);
});

// 管理員操作處理函數 (保持原樣)
const handleAdminUpdate = async ({ updatedData, onSuccess, onError }: any) => {
    console.log('管理員正在修改資料:', updatedData);
    onSuccess();
};

const handleAdminDelete = async ({ record, onSuccess, onError }: any) => {
    console.log('管理員正在刪除資料:', record);
    onSuccess();
}

// 元件掛載時，先獲取所有玩家
onMounted(fetchUsers);
</script>

<style scoped>
.gap-3 { gap: 1rem; }
.gap-2 { gap: 0.5rem; }
</style>