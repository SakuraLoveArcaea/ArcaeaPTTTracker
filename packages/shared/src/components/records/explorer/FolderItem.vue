<template>
    <div
        :class="[isSubfolder ? 'subfolder-group' : 'pack-folder-group', { 'is-active': isOpen }]"
    >
        <!-- 資料夾頂欄 -->
        <div :class="isSubfolder ? 'subfolder-header' : 'pack-folder-header'" @click="emit('toggle')">
            <div class="folder-title-left">
                <i :class="folderIconClass"></i>
                <span v-if="!isSubfolder" class="pack-name">{{ title }}</span>
                
                <!-- 子資料夾左側標記 -->
                <span v-if="isSubfolder" class="subfolder-label">版本</span>
            </div>
            
            <div class="folder-title-right">
                <!-- 歌曲數量在右邊，小字 -->
                <span v-if="count !== undefined" :class="isSubfolder ? 'subsong-count' : 'song-count'">({{ count }})</span>
                <!-- 版本號或分類徽章（貼右邊，展開箭頭的左邊） -->
                <span v-if="isSubfolder" class="subfolder-version-badge">{{ title }}</span>
                <span v-if="!isSubfolder && badge && badge !== '0.0.0' && badge !== 'Others'" class="pack-version-badge">{{ formattedBadge }}</span>
                <i :class="chevronIconClass"></i>
            </div>
        </div>

        <!-- 子清單 (動態展開) -->
        <transition :name="isSubfolder ? 'slide-sub' : 'slide'">
            <div v-show="isOpen" :class="isSubfolder ? 'subfolder-songs-container' : 'pack-songs-container'">
                <slot></slot>
            </div>
        </transition>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
    isOpen: boolean;
    title: string;
    count?: number;
    badge?: string | null;
    icon?: string;
    isSubfolder?: boolean;
}>(), {
    isSubfolder: false,
    badge: null,
    icon: ''
});

const emit = defineEmits(['toggle']);

const formattedBadge = computed(() => {
    if (!props.badge) return '';
    if (props.badge.startsWith('v') || props.badge.startsWith('V') || isNaN(Number(props.badge.charAt(0)))) {
        return props.badge;
    }
    return `v${props.badge}`;
});

const folderIconClass = computed(() => {
    if (props.icon) {
        return `${props.icon} ${props.isSubfolder ? 'subfolder-icon' : 'folder-icon'} ${props.isOpen ? 'active' : ''}`;
    }
    if (props.isSubfolder) {
        return props.isOpen 
            ? 'pi pi-folder-open subfolder-icon active' 
            : 'pi pi-folder subfolder-icon';
    } else {
        return props.isOpen 
            ? 'pi pi-folder-open folder-icon active' 
            : 'pi pi-folder folder-icon';
    }
});

const chevronIconClass = computed(() => {
    return props.isOpen ? 'pi pi-chevron-down chevron-icon' : 'pi pi-chevron-right chevron-icon';
});
</script>

<style scoped lang="scss">
/* 1. 主資料夾樣式 */
.pack-folder-group {
    border: 1px solid var(--border-color, rgba(255, 255, 255, 0.05));
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.02);
    overflow: hidden;
    transition: background-color 0.2s, border-color 0.2s;

    &.is-active {
        border-color: rgba(59, 130, 246, 0.3);
        background: rgba(255, 255, 255, 0.03);
    }
}

.pack-folder-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.85rem 1rem;
    cursor: pointer;
    user-select: none;
    transition: background-color 0.2s;

    &:hover {
        background: rgba(255, 255, 255, 0.04);
    }

    .folder-title-left {
        display: flex;
        align-items: center;
        gap: 0.65rem;
    }

    .folder-title-right {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .folder-icon {
        color: var(--text-muted);
        font-size: 1.1rem;
        transition: color 0.2s;

        &.active {
            color: #3b82f6;
        }
    }

    .pack-name {
        font-weight: 600;
        font-size: 0.95rem;
    }

    .song-count {
        color: var(--text-muted);
        font-size: 0.8rem;
    }

    .pack-version-badge {
        font-size: 0.7rem;
        background: rgba(59, 130, 246, 0.12);
        color: #3b82f6;
        padding: 0.08rem 0.35rem;
        border-radius: 4px;
        font-weight: bold;
        border: 1px solid rgba(59, 130, 246, 0.25);
        font-family: monospace;
    }

    .chevron-icon {
        color: var(--text-muted);
        font-size: 0.85rem;
    }
}

.pack-songs-container {
    border-top: 1px solid var(--border-color, rgba(255, 255, 255, 0.05));
    background: rgba(0, 0, 0, 0.15);
    padding: 0.25rem 0;
}

/* 2. 子資料夾樣式 (Memory Archive 專用) */
.subfolder-group {
    margin: 0.35rem 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.03);
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.015);
    overflow: hidden;
    transition: background-color 0.2s, border-color 0.2s;

    &.is-active {
        border-color: rgba(59, 130, 246, 0.15);
        background: rgba(255, 255, 255, 0.025);
    }
}

.subfolder-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.55rem 0.75rem;
    cursor: pointer;
    user-select: none;
    transition: background-color 0.2s;

    &:hover {
        background: rgba(255, 255, 255, 0.03);
    }

    .folder-title-left {
        display: flex;
        align-items: center;
        gap: 0.65rem;
    }

    .folder-title-right {
        display: flex;
        align-items: center;
        gap: 0.4rem;
    }

    .subfolder-icon {
        color: var(--text-muted);
        font-size: 0.95rem;
        transition: color 0.2s;

        &.active {
            color: #10b981;
        }
    }

    .subfolder-label {
        font-weight: 500;
        font-size: 0.85rem;
        color: var(--text-color);
    }

    .subfolder-version-badge {
        font-weight: bold;
        font-size: 0.72rem;
        font-family: monospace;
        background: rgba(16, 185, 129, 0.12);
        color: #10b981;
        padding: 0.08rem 0.35rem;
        border-radius: 4px;
        border: 1px solid rgba(16, 185, 129, 0.25);
    }

    .subsong-count {
        color: var(--text-muted);
        font-size: 0.75rem;
    }

    .chevron-icon {
        color: var(--text-muted);
        font-size: 0.85rem;
    }
}

.subfolder-songs-container {
    background: rgba(0, 0, 0, 0.1);
    border-top: 1px solid rgba(255, 255, 255, 0.03);
    padding: 0.15rem 0;
}

/* 3. 展開與摺疊過渡動畫 */
.slide-enter-active,
.slide-leave-active {
    transition: max-height 0.3s ease-in-out, opacity 0.25s ease-out;
    max-height: 2000px;
    overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
    max-height: 0;
    opacity: 0;
}

.slide-sub-enter-active,
.slide-sub-leave-active {
    transition: max-height 0.3s ease-in-out, opacity 0.2s ease-out;
    max-height: 1500px;
    overflow: hidden;
}

.slide-sub-enter-from,
.slide-sub-leave-to {
    max-height: 0;
    opacity: 0;
}

/* 日間模式適應樣式 */
:root:not(.p-dark) {
    .pack-folder-group {
        background: rgba(0, 0, 0, 0.01);
        &.is-active {
            background: rgba(0, 0, 0, 0.02);
        }
    }
    .pack-songs-container {
        background: rgba(0, 0, 0, 0.03);
    }
    .subfolder-group {
        background: rgba(0, 0, 0, 0.01);
        border-color: rgba(0, 0, 0, 0.03);
        &.is-active {
            background: rgba(0, 0, 0, 0.02);
            border-color: rgba(59, 130, 246, 0.2);
        }
    }
    .subfolder-songs-container {
        background: rgba(0, 0, 0, 0.02);
        border-top-color: rgba(0, 0, 0, 0.03);
    }
}
</style>
