<template>
    <div class="explorer-header">
        <div class="help-banner">
            <i class="pi pi-info-circle banner-icon"></i>
            <span class="banner-text">提示：點擊右側 「+」 快速新增，點擊難度標籤以該難度新增。長按曲目或點擊可展開詳細屬性。</span>
        </div>
        
        <!-- 工具列：搜尋框 + 分類打包模式切換 -->
        <div class="header-controls-row">
            <div class="search-input-wrapper">
                <i class="pi pi-search search-icon"></i>
                <input
                    :value="modelValue"
                    @input="onInput"
                    type="text"
                    :placeholder="searchPlaceholder"
                    class="search-bar"
                />
                <i v-if="modelValue" class="pi pi-times clear-icon" @click="onClear"></i>
            </div>

            <!-- 分類維度切換 (電腦版使用 SelectButton，手機版使用 Select) -->
            <div class="group-mode-wrapper">
                <div class="desktop-select-button">
                    <SelectButton
                        :modelValue="groupMode"
                        @update:modelValue="onGroupModeChange"
                        :options="groupModeOptions"
                        optionLabel="label"
                        optionValue="value"
                        :allowEmpty="false"
                        size="small"
                    >
                        <template #option="{ option }">
                            <i :class="option.icon" class="mr-1"></i>
                            <span>{{ option.label }}</span>
                        </template>
                    </SelectButton>
                </div>
                <div class="mobile-select-dropdown">
                    <Select
                        :modelValue="groupMode"
                        @update:modelValue="onGroupModeChange"
                        :options="groupModeOptions"
                        optionLabel="label"
                        optionValue="value"
                        size="small"
                        class="mobile-group-select"
                    >
                        <template #value="{ value }">
                            <span v-if="value" class="selected-val">
                                <i :class="getOptionIcon(value)"></i>
                                {{ getOptionLabel(value) }}
                            </span>
                        </template>
                        <template #option="{ option }">
                            <i :class="option.icon" class="mr-2"></i>
                            <span>{{ option.label }}</span>
                        </template>
                    </Select>
                </div>
            </div>
        </div>

        <!-- 僅在「成績狀態」分類模式下顯示難度篩選組件 -->
        <DifficultyFilter
            v-if="groupMode === 'status'"
            :modelValue="selectedDifficulty"
            @update:modelValue="onDifficultyChange"
        />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import SelectButton from 'primevue/selectbutton';
import Select from 'primevue/select';
import DifficultyFilter from './DifficultyFilter.vue';

export type GroupMode = 'pack' | 'version' | 'level' | 'status';

const props = withDefaults(defineProps<{
    modelValue: string;
    groupMode?: GroupMode;
    selectedDifficulty?: string;
}>(), {
    groupMode: 'pack',
    selectedDifficulty: 'ALL'
});

const emit = defineEmits<{
    (e: 'update:modelValue', val: string): void;
    (e: 'update:groupMode', val: GroupMode): void;
    (e: 'update:selectedDifficulty', val: string): void;
}>();

const groupModeOptions = [
    { label: '曲包', value: 'pack', icon: 'pi pi-folder' },
    { label: '版本', value: 'version', icon: 'pi pi-calendar' },
    { label: '等級', value: 'level', icon: 'pi pi-chart-bar' },
    { label: '成績狀態', value: 'status', icon: 'pi pi-star' }
];

const getOptionLabel = (val: string) => groupModeOptions.find(o => o.value === val)?.label || val;
const getOptionIcon = (val: string) => groupModeOptions.find(o => o.value === val)?.icon || 'pi pi-folder';

const searchPlaceholder = computed(() => {
    switch (props.groupMode) {
        case 'version': return '搜尋版本 (如: 6.0)、曲名、作曲者...';
        case 'level': return '搜尋等級 (如: 10+)、定數、曲名...';
        case 'status': return '搜尋成績狀態 (如: EX)、曲名...';
        default: return '搜尋曲包、曲名、作曲者或別名...';
    }
});

const onInput = (e: Event) => {
    emit('update:modelValue', (e.target as HTMLInputElement).value);
};

const onClear = () => {
    emit('update:modelValue', '');
};

const onGroupModeChange = (val: GroupMode) => {
    if (val) {
        emit('update:groupMode', val);
    }
};

const onDifficultyChange = (val: string) => {
    if (val) {
        emit('update:selectedDifficulty', val);
    }
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

/* 工具列：搜尋與模式選擇 */
.header-controls-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;

    @media (max-width: 768px) {
        flex-direction: column;
        align-items: stretch;
        gap: 0.5rem;
    }
}

/* 搜尋框 */
.search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;

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
        padding: 0.55rem 2.2rem;
        background: var(--input-bg, rgba(30, 41, 59, 0.4));
        border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
        border-radius: 8px;
        color: var(--text-color);
        font-size: 0.88rem;
        outline: none;
        transition: border-color 0.2s, box-shadow 0.2s;

        &:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }
    }
}

/* 分類維度選擇器 */
.group-mode-wrapper {
    display: flex;
    align-items: center;
    flex-shrink: 0;
}

.desktop-select-button {
    display: block;

    :deep(.p-selectbutton) {
        .p-button {
            padding: 0.45rem 0.65rem;
            font-size: 0.8rem;
            font-weight: 600;
        }
    }

    @media (max-width: 900px) {
        display: none;
    }
}

.mobile-select-dropdown {
    display: none;
    width: 100%;

    .mobile-group-select {
        width: 100%;
        font-size: 0.85rem;
    }

    .selected-val {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.85rem;
        font-weight: 600;
    }

    @media (max-width: 900px) {
        display: block;
    }
}

/* 日間模式適應樣式 */
:root:not(.p-dark) {
    .help-banner {
        background: rgba(59, 130, 246, 0.05);
    }
}
</style>
