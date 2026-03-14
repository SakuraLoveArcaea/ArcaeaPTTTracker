import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { Record } from '../data';
import { fetchRecords, addRecordDataByRecord, deleteRecordDataByRecord, modifyRecordByRecord } from '../utils/firestore';
import { useAuthStore } from './auth';

const LOCAL_STORAGE_KEY = 'arcaea_local_records';

export const useRecordsStore = defineStore('records', () => {
    const authStore = useAuthStore();
    
    // State
    const records = ref<Record[]>([]);
    const isLoading = ref(false);

    // Getters for Stats
    const b30Avg = computed(() => {
        if (records.value.length === 0) return 0;
        const b30 = records.value.slice(0, 30);
        const sum = b30.reduce((acc, cur) => acc + cur.playPtt, 0);
        return sum / 30;
    });

    const r10Avg = computed(() => {
        if (records.value.length === 0) return 0;
        const b10 = records.value.slice(0, 10);
        const sum = b10.reduce((acc, cur) => acc + cur.playPtt, 0);
        return sum / (b10.length === 10 ? 10 : b10.length);
    });

    const maxPtt = computed(() => {
        return (b30Avg.value * 30 + r10Avg.value * 10) / 40;
    });

    // Actions
    const loadLocalRecords = (): Record[] => {
        const data = localStorage.getItem(LOCAL_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    };

    const saveLocalRecords = (data: Record[]) => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    };

    const clearLocalRecords = () => {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    };

    const loadCloudRecords = async () => {
        if (!authStore.currentUser) return;
        isLoading.value = true;
        try {
            records.value = await fetchRecords(authStore.currentUser);
        } catch (error) {
            console.error("載入失敗", error);
            throw error;
        } finally {
            isLoading.value = false;
        }
    };

    const initLoad = async () => {
        if (authStore.currentUser) {
            await loadCloudRecords();
        } else {
            records.value = loadLocalRecords();
        }
    };

    return {
        records,
        isLoading,
        b30Avg,
        r10Avg,
        maxPtt,
        loadLocalRecords,
        saveLocalRecords,
        clearLocalRecords,
        loadCloudRecords,
        initLoad
    };
});
