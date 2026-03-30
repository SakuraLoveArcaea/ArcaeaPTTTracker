import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { Record } from '@/record';
import { fetchRecords, addRecordDataByRecord, deleteRecordDataByRecord, modifyRecordByRecord } from '@/utils/firestore';
import { useAuthStore } from './authStore';
import {useUIStore} from "./uiStore";
import {calculatePlayPtt} from "@/utils/arcaea";

const LOCAL_STORAGE_KEY = 'arcaea_local_records';

export const useRecordsStore = defineStore('records', () => {
    const authStore = useAuthStore();
    const UIStore = useUIStore();
    
    const records = ref<Record[]>([]);
    const isLoading = ref(false);

    const recordToDelete = ref<Record | null>(null);
    const isDeleteDialogOpen = ref(false)
    const isAddDialogOpen = ref(false)

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

    // locals
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


    // cloud
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

    const addRecord = async (newRecord: Record) => {
        // 樂觀更新
        records.value.unshift(newRecord);
        records.value.sort((a, b) => b.playPtt - a.playPtt);
        const newRankIndex = records.value.findIndex(r => r.id === newRecord.id);

        if (authStore.currentUser) {
            try {
                await addRecordDataByRecord(authStore.currentUser, newRecord);
                UIStore.showToast('success', '新增成功', `${newRecord.title} 已儲存至雲端，排在第 ${newRankIndex + 1} 名`);
            } catch (error: any) {
                UIStore.showToast('error', '新增失敗', error.message);
                // 失敗則還原 UI
                records.value = records.value.filter(r => r.id !== newRecord.id);
            }
        } else {
            saveLocalRecords(records.value);
            UIStore.showToast('success', '新增成功', `${newRecord.title} 已暫存於本機，排在第 ${newRankIndex + 1} 名`);
        }
    };

    const updateRecord = async (oldRecord: Record, newRecord: Record, callbacks?: { onSuccess?: () => void, onError?: () => void, contextMsg?: string }) => {
        const { onSuccess, onError, contextMsg = '更新成功' } = callbacks || {};

        // 判斷是否需要更新 lastUpdate：只有當「分數改變」且「playPtt 提升」時才更新時間
        const isScoreChanged = newRecord.score !== oldRecord.score;
        const isPttIncreased = newRecord.playPtt > oldRecord.playPtt;

        if (isScoreChanged && isPttIncreased) {
            newRecord.lastUpdate = Date.now();
        } else {
            newRecord.lastUpdate = oldRecord.lastUpdate; // 沿用舊的時間
        }

        // 尋找舊排名並暫時移除
        const oldRankIndex = records.value.findIndex(r => r.id === oldRecord.id);

        if (oldRankIndex !== -1) {
            records.value.splice(oldRankIndex, 1);
        }

        // 樂觀更新：放入新資料並重新排序
        records.value.push(newRecord);
        records.value.sort((a, b) => b.playPtt - a.playPtt);

        const newRankIndex = records.value.findIndex(r => r.id === newRecord.id);
        const rankText = oldRankIndex !== newRankIndex
            ? `，排名從第 ${oldRankIndex + 1} 變更為第 ${newRankIndex + 1}`
            : `，維持第 ${newRankIndex + 1} 名`;

        if (authStore.currentUser) {
            try {
                await modifyRecordByRecord(authStore.currentUser, newRecord);
                if (onSuccess) onSuccess();
                UIStore.showToast('success', contextMsg, `${newRecord.title} 已更新至雲端${rankText}`);
            } catch (error: any) {
                if (onError) onError();
                UIStore.showToast('error', '更新失敗', error.message);
                // 失敗則還原 UI
                records.value = records.value.filter(r => r.id !== newRecord.id);
                records.value.push(oldRecord);
                records.value.sort((a, b) => b.playPtt - a.playPtt);
            }
        } else {
            saveLocalRecords(records.value);
            if (onSuccess) onSuccess();
            UIStore.showToast('success', contextMsg, `${newRecord.title} 已暫存於本機${rankText}`);
        }
    };

    const deleteRecord = async () => {
        if (!recordToDelete.value) return;
        const record = recordToDelete.value;

        records.value = records.value.filter(r => r.id !== record.id);

        if (authStore.currentUser) {
            try {
                await deleteRecordDataByRecord(authStore.currentUser, record);
                UIStore.showToast('success', '刪除成功', `${record.title} 已從雲端移除`, 2000);
            } catch (error: any) {
                UIStore.showToast('error', '刪除失敗', error.message);
                records.value.push(record);
                records.value.sort((a, b) => b.playPtt - a.playPtt);
            }
        } else {
            saveLocalRecords(records.value);
            UIStore.showToast('success', '刪除成功', `${record.title} 已從本機移除`, 2000);
        }
        recordToDelete.value = null;
    };

    const onExportRecordsToJson = () => {
        const dataStr = JSON.stringify(records.value, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const dateStr = new Date().toISOString().split('T')[0];
        link.download = `arcaea_records_${dateStr}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const onAddRecordForm = async (form: any) => {
        let parsedScore = form.score || 0;
        if (parsedScore > 1005) parsedScore = parsedScore / 10000;
        const parsedConstant = form.constant || 0;
        const title = form.title.trim();
        const difficulty = form.difficulty;
        const autoUpdate = form.autoUpdate || false; // 從表單獲取 AutoUpdate 屬性

        const existingRecordIndex = records.value.findIndex(r => r.title === title && r.difficulty === difficulty);
        const newPlayPtt = calculatePlayPtt(parsedConstant, parsedScore);

        if (existingRecordIndex !== -1) {
            // 資料已存在：執行更新流程
            const oldRecord = records.value[existingRecordIndex];
            const updatedRecord: Record = {
                ...oldRecord,
                constant: parsedConstant,
                score: parsedScore,
                playPtt: newPlayPtt,
                autoUpdate // 寫入是否自動更新屬性
            } as Record;
            await updateRecord(oldRecord, updatedRecord, { contextMsg: '從表單更新' });
        } else {
            // 資料不存在：執行新增流程
            const recordToSave: Record = {
                id: 'req_' + Date.now().toString(36),
                title: title,
                difficulty: difficulty,
                constant: parsedConstant,
                score: parsedScore,
                playPtt: newPlayPtt,
                lastUpdate: Date.now(),
                autoUpdate // 寫入是否自動更新屬性
            } as Record;
            await addRecord(recordToSave);
        }
    };

    const onUpdateFromTable = async (payload: { updatedData: Record, field: string, onSuccess: () => void, onError: () => void }) => {
        const { updatedData, field, onSuccess, onError } = payload;

        const oldRecord = records.value.find(r => r.id === updatedData.id);
        if (!oldRecord) {
            onError();
            return;
        }

        // 重新計算 playPtt (以防被修改的是 score 或 constant)
        updatedData.playPtt = calculatePlayPtt(updatedData.constant, updatedData.score);

        await updateRecord(oldRecord, updatedData, { onSuccess, onError, contextMsg: '更新成功' });
    };

    const onDelete = (record: Record) => {
        recordToDelete.value = record;
        isDeleteDialogOpen.value = true;
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
        recordToDelete,
        isDeleteDialogOpen,
        isAddDialogOpen,
        b30Avg,
        r10Avg,
        maxPtt,
        loadLocalRecords,
        saveLocalRecords,
        clearLocalRecords,
        loadCloudRecords,
        initLoad,
        addRecord,
        updateRecord,
        deleteRecord,
        onExportRecordsToJson,
        onAddRecordForm,
        onUpdateFromTable,
        onDelete
    };
});
