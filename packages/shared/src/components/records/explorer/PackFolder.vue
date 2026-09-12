<template>
    <FolderItem
        :isOpen="activePack === packName"
        :title="packName"
        :count="songs.length"
        :badge="packVersion"
        :icon="icon"
        @toggle="emit('toggle-pack', packName)"
    >
        <!-- 子版本資料夾分組 (例如: Memory Archive 或 大版本 v6.x 下的小版本) -->
        <template v-if="hasSubVersions">
            <VersionFolder
                v-for="version in effectiveSortedSubVersions"
                :key="version"
                :version="version"
                :songs="effectiveSubVersionsGroup[version] || []"
                :activeSubVersion="activeSubVersion"
                :activeSongId="activeSongId"
                @toggle-subversion="emit('toggle-subversion', $event)"
                @add-record="emit('add-record', $event)"
                @add-record-diff="emit('add-record-diff', $event)"
                @toggle-details="emit('toggle-details', $event)"
            />
        </template>

        <!-- 扁平曲目清單 -->
        <template v-else>
            <SongItemRow
                v-for="song in songs"
                :key="song.objectID"
                :song="song"
                :activeSongId="activeSongId"
                @add-record="emit('add-record', $event)"
                @add-record-diff="emit('add-record-diff', $event)"
                @toggle-details="emit('toggle-details', $event)"
            />
        </template>
    </FolderItem>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Song } from '@tracker/shared/utils/songDatabase';
import FolderItem from './FolderItem.vue';
import SongItemRow from './SongItemRow.vue';
import VersionFolder from './VersionFolder.vue';

const props = defineProps<{
    packName: string;
    songs: Song[];
    activePack: string | null;
    activeSubVersion: string | null;
    activeSongId: string | null;
    packVersion: string | null;
    icon?: string;
    subVersionsGroup?: Record<string, Song[]>;
    sortedSubVersions?: string[];
    memoryArchiveGroupedByVersion?: Record<string, Song[]>;
    sortedMemoryArchiveVersions?: string[];
}>();

const effectiveSubVersionsGroup = computed(() => {
    return props.subVersionsGroup || props.memoryArchiveGroupedByVersion || {};
});

const effectiveSortedSubVersions = computed(() => {
    return props.sortedSubVersions || props.sortedMemoryArchiveVersions || [];
});

const hasSubVersions = computed(() => {
    return effectiveSortedSubVersions.value.some(v => v && v !== 'Others' && v !== '0.0.0');
});

const emit = defineEmits([
    'toggle-pack',
    'toggle-subversion',
    'toggle-details',
    'add-record',
    'add-record-diff'
]);
</script>

<style scoped lang="scss">
</style>
