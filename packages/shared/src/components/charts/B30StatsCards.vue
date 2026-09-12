<template>
    <div :class="containerClass">
        <div :class="cardClass">
            <div class="stat-icon-wrapper mean-bg">
                <i class="pi pi-chart-line"></i>
            </div>
            <div class="stat-info">
                <span class="stat-label">{{ modeName }} 平均値</span>
                <span class="stat-value text-gold">{{ stats.mean.toFixed(4) }}</span>
            </div>
        </div>

        <div :class="cardClass">
            <div class="stat-icon-wrapper median-bg">
                <i class="pi pi-sliders-h"></i>
            </div>
            <div class="stat-info">
                <span class="stat-label">{{ modeName }} 中位數</span>
                <span class="stat-value text-emerald">{{ stats.median.toFixed(4) }}</span>
            </div>
        </div>

        <div :class="cardClass">
            <div class="stat-icon-wrapper std-bg">
                <i class="pi pi-percentage"></i>
            </div>
            <div class="stat-info">
                <span class="stat-label">標準差 (Std Dev)</span>
                <span class="stat-value text-blue">{{ stats.stdDev.toFixed(4) }}</span>
            </div>
        </div>

        <div :class="cardClass">
            <div class="stat-icon-wrapper range-bg">
                <i class="pi pi-arrows-h"></i>
            </div>
            <div class="stat-info">
                <span class="stat-label">單曲 PTT 區間</span>
                <span class="stat-value">{{ stats.min.toFixed(2) }} ~ {{ stats.max.toFixed(2) }}</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';

const props = defineProps({
    stats: {
        type: Object as PropType<{
            mean: number;
            median: number;
            stdDev: number;
            min: number;
            max: number;
        }>,
        required: true
    },
    size: {
        type: String as PropType<'small' | 'large'>,
        default: 'large'
    },
    modeName: {
        type: String,
        default: 'B30'
    }
});

const containerClass = computed(() => {
    return props.size === 'small' ? 'mobile-stats-grid' : 'stats-dialog-content';
});

const cardClass = computed(() => {
    return props.size === 'small' ? 'mobile-stat-card' : 'stat-detail-card';
});
</script>

<style scoped lang="scss">
.stats-dialog-content {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.stat-detail-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1rem;
    background: var(--options-bg);
    border: 1px solid var(--border-color);
    border-radius: 10px;
}

.stat-icon-wrapper {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    
    &.mean-bg {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
    }
    &.median-bg {
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
    }
    &.std-bg {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
    }
    &.range-bg {
        background: rgba(100, 116, 139, 0.1);
        color: var(--text-muted);
    }
}

.stat-info {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
}

.stat-label {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 500;
}

.stat-value {
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--text-color);
    font-family: 'Courier New', Courier, monospace;

    &.text-gold {
        color: #f59e0b;
    }
    &.text-emerald {
        color: #10b981;
    }
    &.text-blue {
        color: #3b82f6;
    }
}

.mobile-stats-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    width: 100%;
    box-sizing: border-box;
}

.mobile-stat-card {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.5rem 0.6rem;
    background: var(--options-bg);
    border: 1px solid var(--border-color);
    border-radius: 10px;
    box-sizing: border-box;
    min-width: 0;

    .stat-icon-wrapper {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.85rem;
        flex-shrink: 0;
        
        &.mean-bg {
            background: rgba(245, 158, 11, 0.1);
            color: #f59e0b;
        }
        &.median-bg {
            background: rgba(16, 185, 129, 0.1);
            color: #10b981;
        }
        &.std-bg {
            background: rgba(59, 130, 246, 0.1);
            color: #3b82f6;
        }
        &.range-bg {
            background: rgba(100, 116, 139, 0.1);
            color: var(--text-muted);
        }
    }

    .stat-info {
        display: flex;
        flex-direction: column;
        gap: 0.05rem;
        min-width: 0;
    }

    .stat-label {
        font-size: 0.65rem;
        color: var(--text-muted);
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .stat-value {
        font-size: 0.85rem;
        font-weight: 700;
        color: var(--text-color);
        font-family: 'Courier New', Courier, monospace;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        &.text-gold {
            color: #f59e0b;
        }
        &.text-emerald {
            color: #10b981;
        }
        &.text-blue {
            color: #3b82f6;
        }
    }
}
</style>
