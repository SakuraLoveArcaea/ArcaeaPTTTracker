<template>
    <div class="records-table-container">
        <DataTable
            :value="records"
            :loading="isLoading"
            size="small"
            sort-field="playPtt"
            :sort-order="-1"
            edit-mode="cell"
            @cell-edit-init="onCellEditInit"
            @cell-edit-complete="onCellEditComplete"
            @cell-edit-cancel="onCellEditCancel"
        >
            <template #empty>
                <div>
                    目前沒有任何成績。<br/>點擊右上角「新增」手動加入，或「匯入」現有資料。
                </div>
            </template>

            <Column key="rank" class="column-rank" style="width: 40px">
                <template #header>
                    <span class="header">#</span>
                </template>
                <template #body="{ data, index }">
                    <button class="body delete-btn" @click="requestDelete(data)">
                        <span class="rank-text">{{ index < 30 ? index + 1 : '-' }}</span>
                    </button>
                </template>
            </Column>

<!--            <Column key="recent" class="column-recent" style="width: 90px">-->
<!--                <template #header>-->
<!--                    <span class="header">recent</span>-->
<!--                </template>-->
<!--                <div class="recent-color"></div>-->
<!--            </Column>-->

            <Column key="title" field="title" class="column-title">
                <template #header>
                    <span class="header">曲名</span>
                </template>
                <template #body="{ data }">
                    <span class="body" :style="getRecentColorLevel(data.lastUpdate, setting.baseHue, setting.maxLevels)">{{ data.title }}</span>
                </template>
                <template #editor="{ data, field }">
                    <InputText class="editor" v-model="data[field]" :disabled="data.autoUpdate === true" autofocus fluid />
                </template>
            </Column>

            <Column key="lastUpdate" field="lastUpdate" class="column-lastUpdate" style="width: 90px">
                <template #header>
                    <span class="header">上次更新</span>
                </template>
                <template #body="{ data }">
                    <span class="body"><small>{{ data.lastUpdate ? new Date(data.lastUpdate).toLocaleDateString() : '-' }}</small></span>
                </template>
            </Column>

            <Column key="difficulty" field="difficulty" class="column-difficulty" style="width: 8rem">
                <template #header>
                    <span class="header">難度</span>
                </template>
                <template #body="{ data }">
                    <span class="body" :style="{ backgroundColor: diffColors[data.difficulty as Difficulty] }">
                        {{ data.difficulty }}
                    </span>
                </template>
                <template #editor="{ data, field }">
                    <Select class="editor" v-model="data[field]" :options="difficulties" :disabled="data.autoUpdate === true" autofocus fluid />
                </template>
            </Column>

            <Column key="constant" field="constant" class="column-constant" style="width: 6rem">
                <template #header>
                    <span class="header">定數</span>
                </template>
                <template #body="{ data }">
                    <span class="body">{{ data.constant.toFixed(1) }}</span>
                </template>
                <template #editor="{ data, field }">
                    <InputNumber class="editor" v-model="data[field]" :minFractionDigits="1" :maxFractionDigits="1" :disabled="data.autoUpdate === true" autofocus fluid />
                </template>
            </Column>

            <Column key="score" field="score" class="column-score" style="width: 8rem">
                <template #header>
                    <span class="header">分數</span>
                </template>
                <template #body="{ data }">
                    <span class="body">{{ data.score.toFixed(4) }}</span>
                </template>
                <template #editor="{ data, field }">
                    <InputNumber class="editor" v-model="data[field]" :minFractionDigits="4" :maxFractionDigits="4" autofocus fluid />
<!--                    <div class="editor">-->
<!--                        <div class="inputs">-->
<!--                            <InputNumber></InputNumber>-->
<!--                            <InputNumber></InputNumber>-->
<!--                        </div>-->

<!--                    </div>-->
                </template>
            </Column>

            <Column key="playPtt" field="playPtt" sortable class="column-ptt" style="width: 6rem">
                <template #header>
                    <span class="header">playPtt</span>
                </template>
                <template #body="{ data }">
                    <span class="body text-primary">{{ data.playPtt.toFixed(4) }}</span>
                </template>
            </Column>
        </DataTable>

        <div v-if="isEditing" class="floating-action-bar">
            <EditingConfirmActions @save="onActionComplete" @cancel="onActionComplete" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { type PropType, ref } from "vue";
import {Difficulty, myRecords, type Record} from "../../../utils/record";
import DataTable from "primevue/datatable";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import Column from "primevue/column";
import Button from "primevue/button";
import Select from "primevue/select";
import { useToast } from "primevue/usetoast";
import EditingConfirmActions from "./EditingConfirmActions.vue";

const props = defineProps({
    records: {
        type: Array as PropType<Record[]>,
        default: () => []
    },
    isLoading: {
        type: Boolean,
        default: false
    },
    setting: {
        type: Object as PropType<{ logBase: number, baseHue: number, maxLevels: number, unitMinutes?: number }>,
        default: () => ({ logBase: 2, baseHue: 142, maxLevels: 7 })
    },
});

const emit = defineEmits<{
    // 傳遞新資料以及成功/失敗的回呼函數
    (e: 'request-update', payload: { updatedData: Record, field: string, onSuccess: () => void, onError: () => void }): void;
    (e: 'request-delete', record: Record): void;
}>();

const toast = useToast();

const difficulties = ref<Difficulty[]>(['PST', 'PRS', 'FTR', 'BYD', 'ETR']);
const diffColors: globalThis.Record<Difficulty, string> = {
    'PST': '#5aa1d9',
    'PRS': '#81b144',
    'FTR': '#a155ab',
    'BYD': '#d63d41',
    'ETR': '#c4a1d1'
};

// ================= 行內編輯器狀態控制 =================
const isEditing = ref(false);
const activeCellCount = ref(0);


const onCellEditInit = () => { activeCellCount.value++; isEditing.value = true; };
const closeEditBar = () => {
    activeCellCount.value = Math.max(0, activeCellCount.value - 1);
    setTimeout(() => { if (activeCellCount.value === 0) isEditing.value = false; }, 150);
};
const forceCloseBar = () => { activeCellCount.value = 0; isEditing.value = false; };
const onCellEditCancel = () => closeEditBar();
const onActionComplete = () => {
    forceCloseBar();
};


// ================= 數據校驗與 Emit =================
const onCellEditComplete = (event: any) => {
    closeEditBar();
    const { data, newValue, field, revert } = event;

    // --- 第一層：UI 與格式防呆校驗 ---
    if (field === 'title') {
        if (!newValue || String(newValue).trim() === '') {
            toast.add({ severity: 'error', summary: '格式錯誤', detail: '標題不能為空！', life: 3000 });
            if (revert) revert();
            return; // 擋下，不通知父組件
        }
    } else if (field === 'constant') {
        if (newValue == null || newValue <= 0 || newValue > 13) {
            toast.add({ severity: 'error', summary: '格式錯誤', detail: '定數範圍錯誤', life: 3000 });
            if (revert) revert();
            return;
        }
    } else if (field === 'score') {
        if (newValue == null || newValue < 0 || newValue > 1005) {
            toast.add({ severity: 'error', summary: '格式錯誤', detail: '分數格式錯誤', life: 3000 });
            if (revert) revert();
            return;
        }
    }

    // 若值沒有改變，則不執行後續動作
    if (data[field] === newValue) return;

    // 準備更新的數據包 (此處不直接修改原始 data，交給父組件決定)
    const updatedData = { ...data, [field]: newValue };

    // --- 第二層：傳遞給父組件處理業務邏輯 ---
    emit('request-update', {
        updatedData,
        field,
        onSuccess: () => {
            // 父組件 API 呼叫成功，這裡不需要做什麼，父組件會更新 props.records
        },
        onError: () => {
            // 父組件 API 呼叫失敗，觸發 UI 復原
            if (revert) revert();
        }
    });
};

const requestDelete = (record: Record) => {
    emit('request-delete', record);
};


// ================ getRecentColorLevel ================
// const getRecentColorLevel = (
//     lastUpdate: number,
//     logBase: number,
//     baseHue: number,
//     maxLevels: number,
//     unitMinutes: number = 30 // 新增參數：基數（分鐘），預設為 30 分鐘
// ) => {
//     if (!lastUpdate) return { borderLeft: '4px solid transparent' };
//
//     const now = Date.now();
//     // 將計算單位動態化
//     const unitMs = 1000 * 60 * unitMinutes;
//     const diffUnits = Math.max(1, (now - lastUpdate) / unitMs);
//
//     // 1. 計算時間層級
//     let level = Math.floor(Math.log(diffUnits) / Math.log(logBase));
//     level = Math.max(0, Math.min(level, maxLevels - 1));
//
//     // 2. 視覺對數映射 (HSL)
//     const minLightness = 45;
//     const maxLightness = 90;
//     const maxSaturation = 85;
//     const minSaturation = 40;
//
//     const currentLightness = minLightness + ((maxLightness - minLightness) / (maxLevels - 1)) * level;
//     const currentSaturation = maxSaturation - ((maxSaturation - minSaturation) / (maxLevels - 1)) * level;
//
//     return {
//         borderLeft: `4px solid hsl(${baseHue}, ${currentSaturation}%, ${currentLightness}%)`
//     };
// };

const getRecentColorLevel = (
    lastUpdate: number,
    baseHue: number = 142,  // 色相
    maxLevels: number = 8   // 你設定了 8 個時間點
) => {
    if (!lastUpdate) return { borderLeft: '4px solid transparent' };

    const now = Date.now();
    const diffMinutes = (now - lastUpdate) / (1000 * 60);

    /**
     * 手動設定的時間層級（分鐘）：
     * 15m, 30m, 1h(60m), 3h(180m), 1d(1440m), 3d(4320m), 1w(10080m), 2w(20160m)
     */
    const timeThresholds = [15, 30, 60, 180, 1440, 4320, 10080, 20160];

    // 找出目前差異分鐘數屬於哪一個 index
    let level = timeThresholds.findIndex(threshold => diffMinutes <= threshold);

    // 如果超過最後一個時間點 (2週)，設為最後一級或透明
    if (level === -1) {
        // 你可以選擇回傳最淡的顏色，或直接透明
        // return { borderLeft: '4px solid transparent' };
        level = timeThresholds.length - 1;
    }

    // 視覺映射 (HSL)
    const minLightness = 45;
    const maxLightness = 90;
    const maxSaturation = 85;
    const minSaturation = 40;

    // 根據 level 計算對應的亮度與飽和度
    const currentLightness = minLightness + ((maxLightness - minLightness) / (maxLevels - 1)) * level;
    const currentSaturation = maxSaturation - ((maxSaturation - minSaturation) / (maxLevels - 1)) * level;

    return {
        borderLeft: `4px solid hsl(${baseHue}, ${currentSaturation}%, ${currentLightness}%)`
    };
};
</script>

<style scoped>

.records-table-container {
    padding-bottom: 80px; /* 預留給浮動按鈕的空間 */
}

/* === header === */
.column-rank .header,
.column-title .header,
.column-lastUpdate .header,
.column-difficulty .header,
.column-constant .header,
.column-score .header,
.column-ptt .header {
    display: block;
    width: 100%;
    font-weight: bold;
    text-align: center;
}

/* === body === */
.column-rank .body,
.column-lastUpdate .body,
.column-constant .body,
.column-score .body,
.column-ptt .body {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 40px;
    text-align: center;
}

.column-difficulty .body {
    display: flex;
    height: 40px;
    justify-content: center;
    align-items: center;
    padding: 0 3rem 0 3rem;
    border-radius: 0.375rem;
    color: #ffffff;
    font-weight: bold;
    text-align: center;
}

/* === title（要靠左） === */

.column-title .body {
    display: inline-flex;
    align-items: center;
    height: 40px;
    padding: 0 1rem;
    width: 100%;
    border-radius: 4px;
}

/* === editor === */
.column-title .editor,
.column-difficulty .editor,
.column-constant .editor{
    display: inline-flex;
    height: 40px;
    width: 100%;
}



.column-score .editor {
    position: relative;
}
.column-score .editor .inputs {
    position: absolute;
    width: 400px;
    display: flex;
    left: -150px;
    bottom: 0;
}

.column-score .editor .inputs InputNumber {

}


/* === rank欄位兼職刪除按鈕 === */
.column-rank .delete-btn {
    cursor: pointer;
    transition: background-color 0.2s;
    width: 100%;
    position: relative;
}
.column-rank .delete-btn:hover {
    background-color: #fee2e2;
    color: #ef4444;

}

.column-rank .delete-btn .rank-text {
    opacity: 100%;
}

/* 查看
.column-title .body:hover {
    background-color: #909399;
}
*/

/* === 編輯中動作 === */
.floating-action-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    padding: 1rem;
    background-color: #ffffff;
    box-shadow: 0 -4px 15px rgba(0, 0, 0, 0.1);
    display: flex;
    gap: 1rem;
    z-index: 1000;
    animation: slideUp 0.3s ease-out;
    animation-fill-mode: forwards;

}

@keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
}




.text-primary { color: var(--p-primary-color, #3b82f6); }
</style>