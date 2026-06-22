<template>
    <nav class="navbar glass-panel">
        <!-- 左側：標題與 LOGO -->
        <NavBrand
            icon="pi-compass"
            desktopTitle="ArcaeaPTTTracker"
        />

        <!-- 中間：核心指標看板 (玻璃質感膠囊) -->
        <NavStats
            :b30Avg="b30Avg"
            :r10Avg="r10Avg"
            :maxPtt="maxPtt"
        />

        <!-- 右側：使用者選單 -->
        <NavUser :forceLogout="forceLogout" />
    </nav>
</template>

<script setup lang="ts">
import NavBrand from './NavBrand.vue';
import NavStats from './NavStats.vue';
import NavUser from './NavUser.vue';
import { useRecordsStore } from "@/stores/recordsStore";
import { storeToRefs } from "pinia";

defineProps({
    forceLogout: {
        type: Boolean,
        default: false
    }
});

const recordsStore = useRecordsStore();
const { b30Avg, r10Avg, maxPtt } = storeToRefs(recordsStore);
</script>

<style scoped lang="scss">
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem 1.5rem;
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  width: 100%;
  box-sizing: border-box;
}

// 響應式佈局重新設計
@media (max-width: 1024px) {
  .navbar {
    display: grid !important;
    grid-template-columns: 1fr auto !important;
    grid-template-rows: auto auto !important;
    gap: 0.5rem;
    padding: 0.65rem 0.85rem;
  }
}

@media (max-width: 768px) {
  .navbar {
    padding: 0.5rem 0.75rem;
  }
}

:root:not(.p-dark) {
  .navbar {
    background: rgba(255, 255, 255, 0.7);
    border-color: rgba(15, 23, 42, 0.05);
  }
}
</style>