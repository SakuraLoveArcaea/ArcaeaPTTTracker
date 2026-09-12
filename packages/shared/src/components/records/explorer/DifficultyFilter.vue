<template>
    <div class="difficulty-filter-container">
        <span class="filter-label">成績難度：</span>
        <div class="diff-badges-wrapper">
            <DifficultyBadge
                v-for="diff in difficulties"
                :key="diff.value"
                :difficulty="diff.value"
                :label="diff.label"
                :active="modelValue === diff.value"
                clickable
                @click="onSelect(diff.value)"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import DifficultyBadge from './DifficultyBadge.vue';

const props = withDefaults(defineProps<{
    modelValue: string;
}>(), {
    modelValue: 'ALL'
});

const emit = defineEmits<{
    (e: 'update:modelValue', val: string): void;
}>();

const difficulties = [
    { label: '全部', value: 'ALL' },
    { label: 'PST', value: 'PST' },
    { label: 'PRS', value: 'PRS' },
    { label: 'FTR', value: 'FTR' },
    { label: 'ETR', value: 'ETR' },
    { label: 'BYD', value: 'BYD' },
    { label: 'INS', value: 'INS' }
];

const onSelect = (val: string) => {
    emit('update:modelValue', val);
};
</script>

<style scoped lang="scss">
.difficulty-filter-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.1rem;
    margin-bottom: 0.5rem;
    flex-wrap: wrap;

    .filter-label {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-muted, #94a3b8);
        user-select: none;
        flex-shrink: 0;
    }

    .diff-badges-wrapper {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        flex-wrap: wrap;
    }
}
</style>
