<template>
    <div class="app-layout bg-slate-50 min-h-screen flex flex-col">

        <header class="app-header bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200 px-4 md:px-6 h-14 flex justify-between items-center sticky top-0 z-50">

            <div class="flex items-center gap-2">
                <i class="pi pi-chart-line text-primary text-xl"></i>
                <h1 class="text-lg font-bold text-gray-800 m-0 whitespace-nowrap tracking-wide">Arcaea PTT Tracker</h1>
                <span v-if="!currentUser" class="text-xs bg-gray-100 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-md ml-2 hidden sm:inline-block whitespace-nowrap">訪客模式</span>
            </div>

            <div class="flex items-center gap-3">
                <Button v-if="!currentUser" label="Google 登入" icon="pi pi-google" severity="info" size="small" rounded @click="handleLogin" />

                <template v-else>
                    <span class="text-sm font-bold text-gray-700 truncate max-w-[120px] sm:max-w-[200px]">
                        {{ currentUser.displayName }}
                    </span>

                    <img
                        v-if="currentUser.photoURL"
                        :src="currentUser.photoURL"
                        class="w-9 h-9 rounded-full shadow-sm border-2 border-transparent hover:border-primary cursor-pointer transition-all flex-shrink-0 object-cover"
                        referrerpolicy="no-referrer"
                        @click="toggleUserMenu"
                        aria-haspopup="true"
                        aria-controls="user_menu"
                        title="帳號選項"
                    />
                    <div
                        v-else
                        class="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all flex-shrink-0"
                        @click="toggleUserMenu"
                        aria-haspopup="true"
                        aria-controls="user_menu"
                    >
                        {{ currentUser.displayName?.charAt(0) || 'U' }}
                    </div>

                    <Menu ref="userMenu" id="user_menu" :model="userMenuItems" :popup="true" class="mt-2" />
                </template>
            </div>
        </header>

        <main class="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full table-container relative">

            <div class="edit-hint hidden-on-mobile mb-4">
                <i class="pi pi-info-circle"></i>
                <span v-if="!currentUser">您目前使用的是 <b>本機暫存模式</b>，清除瀏覽器資料會導致成績遺失。登入即可永久保存並跨裝置同步！</span>
                <span v-else>點擊儲存格直接編輯。按 <b>Enter</b> 儲存，按 <b>Esc</b> 取消。點擊最左側的<b>「排名 (#)」</b>可刪除該筆紀錄。</span>
            </div>

            <DataTable
                :value="records"
                :loading="isLoading || !isAuthReady"
                size="small"
                sort-field="playPtt"
                sort-order="-1"
                edit-mode="cell"
                class="editable-cells-table shadow-sm rounded-lg overflow-hidden"
                @cell-edit-init="onCellEditInit"
                @cell-edit-complete="onCellEditComplete"
                @cell-edit-cancel="onCellEditCancel"
            >
                <template #header>
                    <div class="table-header flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-2">
                        <div class="stats-container flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold">
                            <div class="stat-box">
                                B30 平均：<span class="text-primary text-lg">{{ b30Avg.toFixed(4) }}</span>
                                <span v-if="records.length < 30" class="warning-text">(資料不足 30 筆)</span>
                            </div>
                            <div class="stat-box">
                                R10 平均：<span class="text-primary text-lg">{{ r10Avg.toFixed(4) }}</span>
                            </div>
                            <div class="stat-box">
                                預估最高 PTT：<span class="text-primary text-lg">{{ maxPtt.toFixed(4) }}</span>
                            </div>
                        </div>

                        <div class="actions-container flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                            <Button label="匯入" icon="pi pi-upload" severity="secondary" outlined @click="openImportDialog" title="匯入 JSON" class="flex-1 md:flex-none" />
                            <Button label="新增" icon="pi pi-plus" severity="primary" @click="openAddDialog" class="flex-1 md:flex-none" />
                        </div>
                    </div>
                </template>

                <template #empty>
                    <div class="text-center p-8 text-gray-500">
                        <i class="pi pi-folder-open text-4xl mb-4 block"></i>
                        目前沒有任何成績。<br/>點擊右上角「新增」手動加入，或「匯入」現有資料。
                    </div>
                </template>

                <Column style="width: 70px;" headerStyle="text-align: center;">
                    <template #header><div class="cell-content font-bold justify-center"><b>#</b></div></template>
                    <template #body="slotProps">
                        <div class="cell-content font-bold justify-center relative clickable-rank" :class="slotProps.index < 30 ? 'top-30-rank' : 'rest-rank'" @click="confirmDelete(slotProps.data)" title="點擊刪除此紀錄">
                            <span>{{ slotProps.index < 30 ? slotProps.index + 1 : '-' }}</span>
                            <i class="pi pi-trash delete-icon"></i>
                        </div>
                    </template>
                </Column>
                <Column field="title" style="min-width: 150px;" headerStyle="text-align: left;">
                    <template #header><div class="cell-content font-bold justify-center"><b>標題</b></div></template>
                    <template #body="slotProps"><div class="cell-content text-left">{{ slotProps.data.title }}</div></template>
                    <template #editor="slotProps"><InputText v-model="slotProps.data.title" autofocus fluid class="full-width-input align-left" /></template>
                </Column>
                <Column field="difficulty" style="width: 120px;" headerStyle="text-align: center;">
                    <template #header><div class="cell-content font-bold justify-center"><b>難度</b></div></template>
                    <template #body="slotProps">
                        <div class="cell-content font-bold justify-center gap-2" :class="slotProps.data.difficulty.toLowerCase()">
                            <span>{{ slotProps.data.difficulty }}</span><i class="pi pi-chevron-down opacity-60 text-xs"></i>
                        </div>
                    </template>
                    <template #editor="slotProps"><Select v-model="slotProps.data.difficulty" :options="difficulties" autofocus fluid class="full-width-input custom-select" /></template>
                </Column>
                <Column field="constant" style="width: 100px;" headerStyle="text-align: center;">
                    <template #header><div class="cell-content font-bold justify-center"><b>定數</b></div></template>
                    <template #body="slotProps"><div class="cell-content justify-center">{{ slotProps.data.constant.toFixed(1) }}</div></template>
                    <template #editor="slotProps"><InputNumber v-model="slotProps.data.constant" :minFractionDigits="1" :maxFractionDigits="1" autofocus fluid class="full-width-input" /></template>
                </Column>
                <Column field="score" style="width: 120px;" headerStyle="text-align: center;">
                    <template #header><div class="cell-content font-bold justify-center"><b>分數</b></div></template>
                    <template #body="slotProps"><div class="cell-content justify-center">{{ slotProps.data.score.toFixed(4) }}</div></template>
                    <template #editor="slotProps"><InputNumber v-model="slotProps.data.score" :minFractionDigits="4" :maxFractionDigits="4" autofocus fluid class="full-width-input" /></template>
                </Column>
                <Column field="playPtt" sortable="desc" style="width: 100px;" headerStyle="text-align: center;">
                    <template #header><div class="cell-content font-bold justify-center"><b>playPtt</b></div></template>
                    <template #body="slotProps"><div class="cell-content justify-center font-bold ptt-text">{{ slotProps.data.playPtt.toFixed(4) }}</div></template>
                </Column>
            </DataTable>

            <div v-if="isEditing" class="floating-action-bar">
                <Button label="取消" icon="pi pi-times" severity="secondary" outlined @mousedown.prevent="triggerCancel" class="flex-1" />
                <Button label="儲存" icon="pi pi-check" severity="primary" @mousedown.prevent="triggerSave" class="flex-1" />
            </div>
        </main>

        <footer class="bg-white border-t border-gray-200 py-4 text-center mt-auto">
            <p class="text-sm text-gray-500 m-0">
                Created with <i class="pi pi-heart-fill text-red-500 text-xs mx-1"></i> by
                <a href="https://www.threads.net/@sakuralovearcaea" target="_blank" class="font-bold text-primary hover:underline">SakuraLoveArcaea</a>
            </p>
        </footer>

        <Dialog v-model:visible="showAddDialog" modal header="新增成績紀錄" :style="{ width: '90vw', maxWidth: '400px' }">
            <div class="flex flex-col gap-4 mt-2">
                <div class="flex flex-col gap-2">
                    <label class="font-bold text-gray-700">標題 (Title)</label>
                    <InputText v-model="newRecordForm.title" autofocus placeholder="請輸入歌曲名稱" fluid />
                </div>
                <div class="flex flex-col gap-2">
                    <label class="font-bold text-gray-700">難度</label>
                    <Select v-model="newRecordForm.difficulty" :options="difficulties" fluid />
                </div>
                <div class="flex flex-col gap-2">
                    <label class="font-bold text-gray-700">定數 (Constant)</label>
                    <InputNumber v-model="newRecordForm.constant" :minFractionDigits="1" :maxFractionDigits="1" fluid />
                </div>
                <div class="flex flex-col gap-2">
                    <label class="font-bold text-gray-700">分數 (Score)</label>
                    <InputNumber v-model="newRecordForm.score" :minFractionDigits="0" :maxFractionDigits="4" placeholder="例如: 9939932 或 993.9932" fluid />
                    <small class="text-gray-500">支援輸入完整分數，系統將自動轉換。</small>
                </div>
            </div>
            <template #footer>
                <Button label="取消" icon="pi pi-times" outlined severity="secondary" @click="showAddDialog = false" />
                <Button label="確認新增" icon="pi pi-check" @click="saveNewRecord" />
            </template>
        </Dialog>

        <Dialog v-model:visible="showImportDialog" modal header="匯入 JSON 紀錄" :style="{ width: '90vw', maxWidth: '600px' }">
            <div class="flex flex-col gap-4">
                <div class="import-instructions">
                    <p>請將您的成績資料以 <b>JSON 陣列</b> 的格式貼在下方。</p>
                    <pre class="code-example">
[
  {
    "title": "Abstruse Dilemma",
    "difficulty": "FTR",
    "constant": 11.3,
    "score": 9939932
  }
]</pre>
                </div>
                <div class="options-container">
                    <div class="font-bold text-gray-700 mb-2">匯入選項：</div>
                    <div class="option-item">
                        <Checkbox v-model="overwriteDuplicates" inputId="optOverwrite" :binary="true" :disabled="clearBeforeImport" />
                        <label for="optOverwrite" class="cursor-pointer" :class="{'opacity-50': clearBeforeImport}">若「標題 + 難度」相同，則覆蓋舊紀錄</label>
                    </div>
                    <div class="option-item mt-2">
                        <Checkbox v-model="clearBeforeImport" inputId="optClear" :binary="true" />
                        <label for="optClear" class="cursor-pointer font-bold" :class="{'text-red-500': clearBeforeImport}">⚠️ 匯入前清空您的所有紀錄</label>
                    </div>
                </div>
                <Textarea v-model="importJsonString" rows="8" placeholder="請在此貼上 JSON 陣列..." class="w-full font-mono text-sm mt-2" />
            </div>
            <template #footer>
                <Button label="取消" icon="pi pi-times" outlined severity="secondary" @click="showImportDialog = false" />
                <Button label="確認匯入" icon="pi pi-check" @click="processImport" :loading="isImporting" />
            </template>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { Difficulty, Record } from "./data";
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Textarea from 'primevue/textarea';
import Checkbox from 'primevue/checkbox';
import Menu from 'primevue/menu'; // 新增：引入 PrimeVue Menu 元件
import { useToast } from "primevue/usetoast";

import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, type User } from "firebase/auth";
import { db, auth } from "../firebaseConfig";

const toast = useToast();
const difficulties = ref<Difficulty[]>(['PST', 'PRS', 'FTR', 'BYD', 'ETR']);
const records = ref<Record[]>([]);
const isLoading = ref(true);

const LOCAL_STORAGE_KEY = 'arcaea_local_records';

// --- Local Storage 管理 ---
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

// --- Auth 登入狀態與頭像選單 ---
const currentUser = ref<User | null>(null);
const isAuthReady = ref(false);

const userMenu = ref(); // 綁定 Popup Menu
const toggleUserMenu = (event: Event) => {
    userMenu.value.toggle(event);
};

// 選單項目：放入「登出」按鈕
const userMenuItems = ref([
    {
        label: '帳號設定',
        items: [
            {
                label: '登出',
                icon: 'pi pi-sign-out',
                command: () => { handleLogout(); }
            }
        ]
    }
]);

onMounted(() => {
    onAuthStateChanged(auth, async (user) => {
        currentUser.value = user;
        isAuthReady.value = true;

        if (user) {
            const localData = loadLocalRecords();
            if (localData.length > 0) {
                if (window.confirm("【發現本機紀錄】\n偵測到您有本機的成績紀錄，是否要合併上傳至您的雲端帳號？\n(合併後將清空本機暫存)")) {
                    await mergeLocalToCloud(localData);
                } else {
                    clearLocalRecords();
                }
            }
            await fetchRecords();
        } else {
            records.value = loadLocalRecords();
            records.value.sort((a, b) => b.playPtt - a.playPtt);
            isLoading.value = false;
        }
    });
});

const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
        toast.add({ severity: 'success', summary: '登入成功', detail: `歡迎, ${auth.currentUser?.displayName}`, life: 2000 });
    } catch (error: any) {
        toast.add({ severity: 'error', summary: '登入失敗', detail: error.message, life: 3000 });
    }
};

const handleLogout = async () => {
    if (window.confirm("登出後，是否要在這台裝置上保留一份成績紀錄的備份（訪客模式）？\n(若選擇取消，將清空本機資料)")) {
        saveLocalRecords(records.value);
    } else {
        clearLocalRecords();
    }

    try {
        await signOut(auth);
        toast.add({ severity: 'info', summary: '已登出', detail: '已切換至訪客模式', life: 2000 });
    } catch (error: any) {
        toast.add({ severity: 'error', summary: '登出失敗', detail: error.message, life: 3000 });
    }
};

// --- Firebase 與 本機雙軌存取 Helper ---
const getUserDocRef = (recordId: string) => {
    if (!currentUser.value) throw new Error("無效的呼叫");
    return doc(db, "users", currentUser.value.uid, "records", recordId);
};

const saveRecordData = async (updatedRecord: Record, showToast = true) => {
    try {
        const recordData = JSON.parse(JSON.stringify(updatedRecord));
        if (!recordData.id) throw new Error("缺少唯一 ID");

        if (currentUser.value) {
            await setDoc(getUserDocRef(recordData.id), recordData, { merge: true });
        } else {
            saveLocalRecords(records.value);
        }

        if(showToast) toast.add({ severity: 'success', summary: '儲存成功', detail: `${recordData.title} 已更新`, life: 2000 });
    } catch (error: any) {
        toast.add({ severity: 'error', summary: '儲存失敗', detail: error.message, life: 3000 });
    }
};

const deleteRecordData = async (record: Record) => {
    if (currentUser.value) {
        await deleteDoc(getUserDocRef(record.id));
    } else {
        saveLocalRecords(records.value);
    }
};

const mergeLocalToCloud = async (localData: Record[]) => {
    isLoading.value = true;
    try {
        const uploadPromises = localData.map(item => {
            return setDoc(getUserDocRef(item.id), item, { merge: true });
        });
        await Promise.all(uploadPromises);
        clearLocalRecords();
        toast.add({ severity: 'success', summary: '合併成功', detail: '本機資料已成功上傳至雲端', life: 3000 });
    } catch (err: any) {
        toast.add({ severity: 'error', summary: '合併失敗', detail: err.message, life: 3000 });
    } finally {
        isLoading.value = false;
    }
};

// --- 讀取 Firebase 資料 ---
const fetchRecords = async () => {
    if (!currentUser.value) return;
    try {
        isLoading.value = true;
        const querySnapshot = await getDocs(collection(db, "users", currentUser.value.uid, "records"));
        const fetchedData: Record[] = [];
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            fetchedData.push({
                id: docSnap.id,
                title: data.title || '',
                difficulty: data.difficulty || 'FTR',
                constant: data.constant || 0,
                score: data.score || 0,
                playPtt: data.playPtt || 0
            });
        });
        records.value = fetchedData;
        records.value.sort((a, b) => b.playPtt - a.playPtt);
    } catch (error: any) {
        toast.add({ severity: 'error', summary: '載入失敗', detail: error.message, life: 3000 });
    } finally {
        isLoading.value = false;
    }
};

// --- PTT 統計計算 ---
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

// ================= 新增紀錄 =================
const showAddDialog = ref(false);
const newRecordForm = ref({ title: '', difficulty: 'FTR' as Difficulty, constant: 10.0, score: null as number | null });

const openAddDialog = () => {
    newRecordForm.value = { title: '', difficulty: 'FTR', constant: 10.0, score: null };
    showAddDialog.value = true;
};

const saveNewRecord = async () => {
    if (!newRecordForm.value.title.trim()) { toast.add({ severity: 'error', summary: '驗證失敗', detail: '標題不能為空白', life: 3000 }); return; }

    let parsedScore = newRecordForm.value.score || 0;
    if (parsedScore > 1005) parsedScore = parsedScore / 10000;
    const parsedConstant = newRecordForm.value.constant || 0;

    const newId = 'req_' + Date.now().toString(36);
    const recordToSave: Record = {
        id: newId, title: newRecordForm.value.title.trim(), difficulty: newRecordForm.value.difficulty,
        constant: parsedConstant, score: parsedScore, playPtt: calculatePlayPtt(parsedConstant, parsedScore)
    };

    showAddDialog.value = false;
    records.value.unshift(recordToSave);
    records.value.sort((a, b) => b.playPtt - a.playPtt);

    await saveRecordData(recordToSave, true);
};

// --- 刪除功能 ---
const confirmDelete = async (record: Record) => {
    if (window.confirm(`【刪除確認】\n確定要刪除「${record.title}」的成績嗎？`)) {
        if (window.confirm(`【最終確認】\n刪除後無法復原，確定要刪除「${record.title}」嗎？`)) {
            try {
                records.value = records.value.filter(r => r.id !== record.id);
                await deleteRecordData(record);
                toast.add({ severity: 'success', summary: '已刪除', detail: `${record.title} 已移除`, life: 2000 });
            } catch (error) {
                toast.add({ severity: 'error', summary: '刪除失敗', detail: '請檢查網路連線', life: 3000 });
            }
        }
    }
};

// --- JSON 匯入功能 ---
const showImportDialog = ref(false);
const importJsonString = ref('');
const isImporting = ref(false);
const overwriteDuplicates = ref(true);
const clearBeforeImport = ref(false);

const openImportDialog = () => {
    importJsonString.value = ''; clearBeforeImport.value = false; overwriteDuplicates.value = true; showImportDialog.value = true;
};

const processImport = async () => {
    if (!importJsonString.value.trim()) { toast.add({ severity: 'warn', summary: '提示', detail: '請輸入 JSON 資料', life: 3000 }); return; }
    try {
        let jsonData = JSON.parse(importJsonString.value);
        if (!Array.isArray(jsonData)) jsonData = [jsonData];

        if (clearBeforeImport.value) {
            if (!window.confirm("【危險操作】確定清空您的所有紀錄嗎？")) return;
            isImporting.value = true;
            if (currentUser.value) {
                const deletePromises = records.value.map(r => deleteDoc(getUserDocRef(r.id)));
                await Promise.all(deletePromises);
            }
            records.value = [];
        } else {
            isImporting.value = true;
        }

        const uploadPromises: Promise<void>[] = [];

        jsonData.forEach((item: any) => {
            let targetId = item.id;
            if (!targetId && overwriteDuplicates.value && !clearBeforeImport.value) {
                const existing = records.value.find(r => r.title === item.title && r.difficulty === (item.difficulty || 'FTR'));
                if (existing) targetId = existing.id;
            }
            if (!targetId) targetId = 'imp_' + Math.random().toString(36).substr(2, 9);

            const parsedConstant = Number(item.constant) || 0;
            let parsedScore = Number(item.score) || 0;
            if (parsedScore > 1005) { parsedScore = parsedScore / 10000; }
            const autoCalculatedPtt = item.playPtt !== undefined ? Number(item.playPtt) : calculatePlayPtt(parsedConstant, parsedScore);

            const cleanRecord: Record = { id: targetId, title: item.title || 'Unknown', difficulty: item.difficulty || 'FTR', constant: parsedConstant, score: parsedScore, playPtt: autoCalculatedPtt };

            if (currentUser.value) {
                uploadPromises.push(setDoc(getUserDocRef(targetId), cleanRecord, { merge: true }));
            }

            const existIndex = records.value.findIndex(r => r.id === targetId);
            if (existIndex > -1) records.value[existIndex] = cleanRecord;
            else records.value.push(cleanRecord);
        });

        if (currentUser.value) {
            await Promise.all(uploadPromises);
            await fetchRecords();
        } else {
            records.value.sort((a, b) => b.playPtt - a.playPtt);
            saveLocalRecords(records.value);
        }

        toast.add({ severity: 'success', summary: '匯入成功', detail: `成功處理 ${jsonData.length} 筆資料`, life: 3000 });
        showImportDialog.value = false;
    } catch (err: any) {
        toast.add({ severity: 'error', summary: '解析失敗', detail: 'JSON 格式不正確', life: 4000 });
    } finally {
        isImporting.value = false;
    }
};

// --- 編輯與同步邏輯 ---
const isEditing = ref(false);
const activeCellCount = ref(0);
const onCellEditInit = () => { activeCellCount.value++; isEditing.value = true; };
const closeEditBar = () => { activeCellCount.value = Math.max(0, activeCellCount.value - 1); setTimeout(() => { if (activeCellCount.value === 0) isEditing.value = false; }, 150); };
const forceCloseBar = () => { activeCellCount.value = 0; isEditing.value = false; };
const onCellEditCancel = () => closeEditBar();
const triggerSave = () => { const activeEl = document.activeElement as HTMLElement; if (activeEl && activeEl.tagName !== 'BODY') activeEl.blur(); forceCloseBar(); };
const triggerCancel = () => { const activeEl = document.activeElement as HTMLElement; if (activeEl && activeEl.tagName !== 'BODY') { activeEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true })); activeEl.blur(); } forceCloseBar(); };

const calculatePlayPtt = (constant: number, score: number): number => {
    const fullScore = score > 1005 ? score : score * 10000;
    let ptt = 0;
    if (fullScore >= 10000000) ptt = constant + 2.0;
    else if (fullScore >= 9800000) ptt = constant + 1.0 + (fullScore - 9800000) / 200000;
    else ptt = constant + (fullScore - 9500000) / 300000;
    return Math.max(0, Number(ptt.toFixed(4)));
};

const onCellEditComplete = (event: any) => {
    closeEditBar();
    const { data, newValue, field, revert } = event;
    let isModified = false;

    if (field === 'title') {
        if (!newValue || String(newValue).trim() === '') { toast.add({ severity: 'error', summary: '錯誤', detail: '標題不能為空！', life: 3000 }); if (revert) revert(); }
        else if (data[field] !== newValue) { data[field] = newValue; isModified = true; }
    } else if (field === 'difficulty') {
        if (data[field] !== newValue) { data[field] = newValue; isModified = true; }
    } else if (field === 'constant') {
        if (newValue == null || newValue <= 0 || newValue > 13) { toast.add({ severity: 'error', summary: '錯誤', detail: '定數範圍錯誤', life: 3000 }); if (revert) revert(); }
        else if (data[field] !== newValue) { data[field] = parseFloat(newValue.toFixed(1)); data.playPtt = calculatePlayPtt(data[field], data.score); isModified = true; }
    } else if (field === 'score') {
        if (newValue == null || newValue < 0 || newValue > 1005) { toast.add({ severity: 'error', summary: '錯誤', detail: '分數格式錯誤', life: 3000 }); if (revert) revert(); }
        else if (data[field] !== newValue) { data[field] = parseFloat(newValue.toFixed(4)); data.playPtt = calculatePlayPtt(data.constant, data[field]); isModified = true; }
    }

    if (isModified) {
        records.value.sort((a, b) => b.playPtt - a.playPtt);
        saveRecordData(data);
    }
};
</script>

<style scoped>
/* 版面框架設定 (確保 body 沒預設留白) */
:global(body) { margin: 0; padding: 0; }
.app-layout { padding-bottom: 2rem; }
.app-header { border-bottom: 1px solid var(--p-surface-200, #e2e8f0); }
.table-container { padding-bottom: 80px; }
.table-header { background-color: var(--p-surface-0, #ffffff); border-bottom: 1px solid var(--p-surface-200, #e2e8f0); }

/* 文字樣式 */
.text-primary { color: var(--p-primary-color, #3b82f6); }
.warning-text { color: #ef4444; font-size: 0.75rem; margin-left: 0.5rem; font-weight: normal; }

/* 刪除欄位 */
.clickable-rank { cursor: pointer; transition: background-color 0.2s; border-radius: 4px; }
.clickable-rank:hover { background-color: #fee2e2; color: #ef4444; }
.clickable-rank:hover .delete-icon { opacity: 1; transform: scale(1.1); }
.delete-icon { position: absolute; right: 8px; font-size: 0.8rem; color: #ef4444; opacity: 0.4; transition: all 0.2s; }

/* 匯入對話框樣式 */
.import-instructions { background-color: #f8fafc; padding: 1rem; border-radius: 6px; border-left: 4px solid #3b82f6; }
.code-example { background-color: #1e293b; color: #e2e8f0; padding: 0.75rem; border-radius: 4px; font-size: 0.8rem; margin-top: 0.5rem; overflow-x: auto; }
.options-container { background-color: #f1f5f9; padding: 1rem; border-radius: 6px; margin-top: 1rem; }
.option-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; }
.opacity-50 { opacity: 0.5; }
.text-red-500 { color: #ef4444; }

/* 其餘表格與浮動按鈕樣式 */
.edit-hint { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; background-color: var(--p-surface-100, #f8f9fa); border-left: 4px solid var(--p-primary-color, #3b82f6); border-radius: 4px; font-size: 0.9rem; color: var(--p-text-color, #495057); }
.floating-action-bar { position: fixed; bottom: 0; left: 0; width: 100%; padding: 1rem; background-color: var(--p-surface-0, #ffffff); box-shadow: 0 -4px 15px rgba(0, 0, 0, 0.1); display: flex; gap: 1rem; z-index: 1000; animation: slideUp 0.3s ease-out; padding-bottom: calc(1rem + env(safe-area-inset-bottom)); }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
.flex-1 { flex: 1; } .gap-2 { gap: 0.5rem; } .opacity-60 { opacity: 0.6; } .text-xs { font-size: 0.75rem; }
:deep(.editable-cells-table .p-datatable-tbody > tr > td) { padding: 0 !important; }
.cell-content { padding: 0.5rem 0.75rem; min-height: 40px; display: flex; align-items: center; box-sizing: border-box; width: 100%; }
.justify-center { justify-content: center; } .text-left { justify-content: flex-start; }
.top-30-rank { color: #a155ab; background-color: rgba(161, 85, 171, 0.05); } .rest-rank { color: var(--p-text-muted-color, #adb5bd); }
.ptt-text { color: var(--p-primary-color, #3b82f6); }
.pst { color: #5aa1d9; } .prs { color: #81b144; } .ftr { color: #a155ab; } .byd { color: #d63d41; } .etr { color: #c4a1d1; }
:deep(.full-width-input) { width: 100% !important; }
:deep(.full-width-input .p-inputtext), :deep(.full-width-input .p-inputnumber-input) { padding: 0.5rem 0.75rem; width: 100% !important; min-height: 40px; border-radius: 0; border: none; box-shadow: none; background-color: var(--p-surface-0, #ffffff); box-sizing: border-box; text-align: center; }
:deep(.align-left.p-inputtext) { text-align: left; }
:deep(.custom-select) { border: none; border-radius: 0; min-height: 40px; box-shadow: none; }
:deep(.custom-select .p-select-label) { padding: 0.5rem 0.75rem; display: flex; align-items: center; justify-content: center; }
:deep(.full-width-input .p-inputtext:focus), :deep(.full-width-input .p-inputnumber-input:focus), :deep(.custom-select:focus-within) { outline: 2px solid var(--p-primary-color, #3b82f6); outline-offset: -2px; }
@media (max-width: 768px) { .hidden-on-mobile { display: none; } .table-header { flex-direction: column; align-items: flex-start; } .actions-container { width: 100%; justify-content: space-between; } }
</style>