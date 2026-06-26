<template>
    <div class="explorer-header">
        <div class="help-banner">
            <i class="pi pi-info-circle banner-icon"></i>
            <span class="banner-text">提示：點擊右側 「+」 快速新增，點擊難度標籤以該難度新增。長按曲目或點擊可展開詳細屬性。</span>
        </div>
        
        <div class="search-input-wrapper">
            <i class="pi pi-search search-icon"></i>
            <input
                :value="modelValue"
                @input="onInput"
                type="text"
                placeholder="搜尋曲包、曲名、作曲者或別名..."
                class="search-bar"
            />
            <i v-if="modelValue" class="pi pi-times clear-icon" @click="onClear"></i>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    modelValue: string;
}>();

const emit = defineEmits(['update:modelValue']);

const onInput = (e: Event) => {
    emit('update:modelValue', (e.target as HTMLInputElement).value);
};

const onClear = () => {
    emit('update:modelValue', '');
};
</script>

<style scoped lang="scss">
.explorer-header {
    display: flex;
    flex-direction: column;
    margin-bottom: 0.5rem;
}

/* 提示橫幅 */
.help-banner {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.65rem 0.85rem;
    background: rgba(59, 130, 246, 0.08);
    border-left: 3px solid #3b82f6;
    border-radius: 4px;
    margin-bottom: 0.75rem;

    .banner-icon {
        color: #3b82f6;
        font-size: 1rem;
        flex-shrink: 0;
    }

    .banner-text {
        font-size: 0.8rem;
        color: var(--text-muted);
        line-height: 1.4;
    }
}

/* 搜尋框 */
.search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;

    .search-icon {
        position: absolute;
        left: 0.75rem;
        color: var(--text-muted);
    }

    .clear-icon {
        position: absolute;
        right: 0.75rem;
        color: var(--text-muted);
        cursor: pointer;
        transition: color 0.2s;

        &:hover {
            color: var(--text-color);
        }
    }

    .search-bar {
        width: 100%;
        padding: 0.6rem 2.2rem;
        background: var(--input-bg, rgba(30, 41, 59, 0.4));
        border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
        border-radius: 6px;
        color: var(--text-color);
        font-size: 0.9rem;
        outline: none;
        transition: border-color 0.2s, box-shadow 0.2s;

        &:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }
    }
}

/* 日間模式適應樣式 */
:root:not(.p-dark) {
    .help-banner {
        background: rgba(59, 130, 246, 0.05);
    }
}
</style>
