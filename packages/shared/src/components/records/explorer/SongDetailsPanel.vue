<template>
    <transition name="slide-inner">
        <div v-show="show" class="song-details-panel">
            <div class="details-grid">
                <div class="detail-cell">
                    <span class="detail-label">BPM:</span>
                    <span class="detail-val">{{ song.bpm || 'N/A' }}</span>
                </div>
                <div class="detail-cell">
                    <span class="detail-label">時長:</span>
                    <span class="detail-val">{{ song.duration || 'N/A' }}</span>
                </div>
                <div v-if="song.version_added" class="detail-cell">
                    <span class="detail-label">版本:</span>
                    <span class="detail-val">v{{ song.version_added }}</span>
                </div>
            </div>
            
            <!-- 附加難度詳細 (例如: INS: 12 (12.0), BYD1 [Moment]: 9 (9.6)) -->
            <div v-if="formattedExtras" class="details-row">
                <span class="detail-label">附加譜面:</span>
                <span class="detail-val">{{ formattedExtras }}</span>
            </div>

            <!-- 追加難度版本 (例如: ETR: v5.4.0) -->
            <div v-if="formattedDiffUpdates" class="details-row">
                <span class="detail-label">追加記錄:</span>
                <span class="detail-val">{{ formattedDiffUpdates }}</span>
            </div>

            <!-- 別名 -->
            <div v-if="song.aliases && song.aliases.length" class="details-row">
                <span class="detail-label">別名:</span>
                <span class="detail-val font-italic">{{ song.aliases.join(', ') }}</span>
            </div>
        </div>
    </transition>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Song } from '@tracker/shared/utils/songDatabase';

const props = defineProps<{
    song: Song;
    show: boolean;
}>();

const formattedExtras = computed(() => {
    if (!props.song.extras || props.song.extras.length === 0) return null;
    return props.song.extras.map(e => {
        const namePart = e.name ? ` [${e.name}]` : '';
        const constPart = e.constant !== undefined ? ` (${e.constant.toFixed(1)})` : '';
        return `${e.type}${namePart}: Lv.${e.level}${constPart}`;
    }).join(', ');
});

const formattedDiffUpdates = computed(() => {
    if (!props.song.diff_updates) return null;
    const entries = Object.entries(props.song.diff_updates);
    if (entries.length === 0) return null;
    return entries.map(([diff, ver]) => `${diff} (v${ver})`).join(', ');
});
</script>

<style scoped lang="scss">
.song-details-panel {
    background: rgba(0, 0, 0, 0.25);
    padding: 0.65rem 1rem;
    border-left: 3px solid #3b82f6;
    font-size: 0.78rem;
    color: var(--text-muted);
}

.details-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
    margin-bottom: 0.35rem;

    .detail-cell {
        display: flex;
        gap: 0.3rem;
    }
}

.details-aliases,
.details-row {
    display: flex;
    gap: 0.3rem;
    margin-top: 0.25rem;
    word-break: break-all;
}

.detail-label {
    font-weight: bold;
    color: var(--text-color);
}

.detail-val {
    color: var(--text-muted);
}

.font-italic {
    font-style: italic;
}

.slide-inner-enter-active,
.slide-inner-leave-active {
    transition: max-height 0.2s ease-in-out, opacity 0.15s ease-out;
    max-height: 120px;
    overflow: hidden;
}

.slide-inner-enter-from,
.slide-inner-leave-to {
    max-height: 0;
    opacity: 0;
}

/* 日間模式適應樣式 */
:root:not(.p-dark) {
    .song-details-panel {
        background: rgba(0, 0, 0, 0.05);
    }
}
</style>
