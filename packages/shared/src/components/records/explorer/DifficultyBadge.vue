<template>
    <span
        class="diff-badge"
        :class="[getDiffClass(difficulty), { 'clickable': clickable }]"
        :title="clickable ? '點擊以該難度新增成績' : undefined"
        @click="onClick"
    >
        {{ difficulty }} {{ constant.toFixed(1) }}
    </span>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
    difficulty: string;
    constant: number;
    clickable?: boolean;
}>(), {
    clickable: true
});

const emit = defineEmits(['click']);

const getDiffClass = (diff: string) => {
    const d = diff.toUpperCase();
    if (d.includes('PST')) return 'diff-pst';
    if (d.includes('PRS')) return 'diff-prs';
    if (d.includes('FTR')) return 'diff-ftr';
    if (d.includes('BYD')) return 'diff-byd';
    if (d.includes('ETR')) return 'diff-etr';
    return '';
};

const onClick = (event: MouseEvent) => {
    if (props.clickable) {
        emit('click', event);
    }
};
</script>

<style scoped lang="scss">
.diff-badge {
    padding: 0.12rem 0.3rem;
    border-radius: 3px;
    font-size: 0.62rem;
    font-weight: 700;
    color: #fff;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    user-select: none;
    display: inline-block;

    &.clickable {
        cursor: pointer;
        transition: transform 0.15s, filter 0.15s;

        &:hover {
            transform: scale(1.08);
            filter: brightness(1.15);
        }

        &:active {
            transform: scale(0.95);
        }
    }

    @media (min-width: 769px) {
        padding: 0.18rem 0.45rem;
        font-size: 0.72rem;
        border-radius: 4px;
    }
}

.diff-pst { background-color: #5aa1d9; }
.diff-prs { background-color: #81b144; }
.diff-ftr { background-color: #a155ab; }
.diff-byd { background-color: #d63d41; }
.diff-etr { background-color: #c4a1d1; }
</style>
