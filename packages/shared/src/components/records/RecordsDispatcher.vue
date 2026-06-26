<template>
    <div class="records-dispatcher-container">
        <!-- 使用動態組件渲染，並轉發所有需要的事件監聽器 -->
        <component
            :is="activeComponent"
            v-bind="$props"
            v-model:search-query="searchQuery"
            @request-update="(p) => $emit('request-update', p)"
            @request-delete="(r) => $emit('request-delete', r)"
            @request-add="(form) => $emit('request-add', form)"
            @request-import="(p) => $emit('request-import', p)"
            @request-export="() => $emit('request-export')"
        />
    </div>
</template>

<script setup lang="ts">
import { type PropType, defineAsyncComponent, computed } from "vue";
import { type Record } from "@tracker/shared/utils/record";
import { useUIStore } from "@tracker/shared/stores/uiStore";

const searchQuery = defineModel('searchQuery', { type: String, default: '' });

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
    editable: {
        type: Boolean,
        default: false
    },
    deletable: {
        type: Boolean,
        default: false
    },
    showFading: {
        type: Boolean,
        default: true
    },
    visibleColumns: {
        type: Array as PropType<string[]>,
        default: () => ['rank', 'title', 'lastUpdate', 'difficulty', 'constant', 'score', 'playPtt']
    }
});

defineEmits<{
    (e: 'request-update', payload: { updatedData: Record, field: string, onSuccess: () => void, onError: () => void }): void;
    (e: 'request-delete', record: Record): void;
    (e: 'request-add', form: any): void;
    (e: 'request-import', payload: { data: any[], overwrite: boolean, clearAll: boolean }): void;
    (e: 'request-export'): void;
}>();

const UIStore = useUIStore();

// 1. 使用集中管理的 isMobile 偵測視窗寬度
const isMobile = computed(() => UIStore.isMobile);

// 2. 異步懶加載：只有真正渲染時才會下載組件的程式碼
const DesktopTable = defineAsyncComponent(() => import("./desktop/DesktopTable.vue"));
const MobileList = defineAsyncComponent(() => import("./mobile/MobileList.vue"));

// 3. 計算目前應顯示的組件
const activeComponent = computed(() => {
    return isMobile.value ? MobileList : DesktopTable;
});
</script>

<style scoped lang="scss">
.records-dispatcher-container {
  position: relative;
  width: 100%;
}
</style>