<template>
    <FolderItem
        :isOpen="activePack === packName"
        :title="packName"
        :count="songs.length"
        :badge="packVersion"
        @toggle="emit('toggle-pack', packName)"
    >
        <!-- 特例：Memory Archive 的版本子資料夾 -->
        <template v-if="packName === 'Memory Archive'">
            <VersionFolder
                v-for="version in sortedMemoryArchiveVersions"
                :key="version"
                :version="version"
                :songs="memoryArchiveGroupedByVersion[version] || []"
                :activeSubVersion="activeSubVersion"
                :activeSongId="activeSongId"
                @toggle-subversion="emit('toggle-subversion', $event)"
                @add-record="emit('add-record', $event)"
                @add-record-diff="emit('add-record-diff', $event)"
                @toggle-details="emit('toggle-details', $event)"
            />
        </template>

        <!-- 一般曲包的扁平曲目清單 -->
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
import { Song } from '@tracker/shared/utils/songDatabase';
import FolderItem from './FolderItem.vue';
import SongItemRow from './SongItemRow.vue';
import VersionFolder from './VersionFolder.vue';

defineProps<{
    packName: string;
    songs: Song[];
    activePack: string | null;
    activeSubVersion: string | null;
    activeSongId: string | null;
    packVersion: string | null;
    memoryArchiveGroupedByVersion: Record<string, Song[]>;
    sortedMemoryArchiveVersions: string[];
}>();

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
