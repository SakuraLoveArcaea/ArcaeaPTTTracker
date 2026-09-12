<template>
    <div class="chart-header-row">
        <div 
            v-if="!isMobileView"
            class="header-left-stats" 
            @click="emit('click-title')" 
            title="點擊查看詳細統計數據"
        >
            <h4 class="chart-title">
                你的 {{ modeName }} 趨勢
                <i class="pi pi-info-circle info-icon"></i>
            </h4>
            <span class="chart-subtitle">點擊此處查看詳細統計數據（平均值、中位數、標準差）</span>
        </div>
        <div v-else class="header-left-stats-mobile">
            <h4 class="chart-title">
                你的 {{ modeName }} 趨勢
            </h4>
        </div>
        <div class="header-right-toggle" v-if="!isMobileView">
            <Button 
                :label="showSongNamesOnX ? '顯示排名' : '顯示歌名'" 
                :icon="showSongNamesOnX ? 'pi pi-hashtag' : 'pi pi-align-left'"
                size="small" 
                outlined
                severity="secondary"
                @click="emit('toggle-xaxis')"
                class="toggle-xaxis-btn"
                :disabled="!showSinglePttLine"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button';

defineProps({
    isMobileView: {
        type: Boolean,
        default: false
    },
    showSongNamesOnX: {
        type: Boolean,
        default: true
    },
    showSinglePttLine: {
        type: Boolean,
        default: true
    },
    modeName: {
        type: String,
        default: 'B30'
    }
});

const emit = defineEmits<{
    (e: 'click-title'): void;
    (e: 'toggle-xaxis'): void;
}>();
</script>

<style scoped lang="scss">
.chart-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0.75rem;
    user-select: none;
    gap: 1rem;
}

.header-left-stats {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    cursor: pointer;
    border-radius: 8px;
    transition: background-color 0.2s, transform 0.2s;
    padding: 0.25rem 0.5rem;
    flex: 1;
    min-width: 0;

    &:hover {
        background: var(--options-bg);
        transform: translateY(-1px);
        
        .chart-title {
            color: var(--primary);
            .info-icon {
                color: var(--primary);
                transform: scale(1.1);
            }
        }
    }
    
    &:active {
        transform: translateY(0);
    }
}

.header-right-toggle {
    display: flex;
    align-items: center;
}

.toggle-xaxis-btn {
    font-weight: 600 !important;
    font-size: 0.75rem !important;
}

.chart-title {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--text-color);
    margin: 0;
    transition: color 0.2s;

    .info-icon {
        font-size: 0.95rem;
        color: var(--text-muted);
        transition: all 0.2s;
    }
}

.chart-subtitle {
    font-size: 0.75rem;
    color: var(--text-muted);
}

.header-left-stats-mobile {
    display: flex;
    flex-direction: column;
    padding: 0.25rem 0.5rem;
    flex: 1;
    min-width: 0;
}
</style>
