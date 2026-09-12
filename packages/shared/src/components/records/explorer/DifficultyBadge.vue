<template>
    <span
        class="diff-badge"
        :class="[
            getDiffClass(difficulty),
            {
                'clickable': clickable,
                'is-active': active,
                'is-inactive': active === false
            }
        ]"
        :title="titleText"
        @click="onClick"
    >
        {{ displayText }}
    </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
    difficulty: string;
    constant?: number;
    label?: string;
    clickable?: boolean;
    active?: boolean;
}>(), {
    clickable: false,
    active: undefined
});

const emit = defineEmits(['click']);

const displayText = computed(() => {
    if (props.label) return props.label;

    // 若為 BYD1 / BYD2 等多 Beyond 譜面，統一顯示為 "BYD"
    let displayDiff = props.difficulty;
    if (displayDiff.toUpperCase().startsWith('BYD')) {
        displayDiff = 'BYD';
    }

    if (props.constant !== undefined && props.constant !== null) {
        return `${displayDiff} ${props.constant.toFixed(1)}`;
    }
    return displayDiff;
});

const titleText = computed(() => {
    if (props.clickable && props.constant !== undefined) {
        return '點擊以該難度新增成績';
    }
    return undefined;
});

const getDiffClass = (diff: string) => {
    const d = (diff || '').toUpperCase();
    if (d === 'ALL' || d === '全部') return 'diff-all';
    if (d.includes('PST')) return 'diff-pst';
    if (d.includes('PRS')) return 'diff-prs';
    if (d.includes('FTR')) return 'diff-ftr';
    if (d.includes('BYD')) return 'diff-byd';
    if (d.includes('ETR')) return 'diff-etr';
    if (d.includes('INS')) return 'diff-ins';
    return 'diff-all';
};

const onClick = (event: MouseEvent) => {
    if (props.clickable) {
        emit('click', event);
    }
};
</script>

<style scoped lang="scss">
.diff-badge {
    font-size: 0.7rem;
    font-weight: 800;
    color: white;
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
    align-self: flex-start;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    user-select: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1.2;
    transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
    -webkit-tap-highlight-color: transparent;

    &.clickable {
        cursor: pointer;

        &:hover {
            transform: scale(1.05);
            filter: brightness(1.12);
        }

        &:active {
            transform: scale(0.95);
        }
    }

    &.is-inactive {
        opacity: 0.38;
        transform: scale(0.96);

        &:hover {
            opacity: 0.8;
            transform: scale(1.02);
        }
    }

    &.is-active {
        opacity: 1;
        transform: scale(1.06);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35), 0 0 0 1.5px rgba(255, 255, 255, 0.7);
    }
}

.diff-all { background-color: #475569; }
.diff-pst { background-color: #5aa1d9; }
.diff-prs { background-color: #81b144; }
.diff-ftr { background-color: #a155ab; }
.diff-etr { background-color: #c4a1d1; }
.diff-byd { background-color: #d63d41; }
.diff-ins { background-color: #1d4ed8; }
</style>
