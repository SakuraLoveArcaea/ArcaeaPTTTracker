<template>
    <FolderItem
        :isOpen="activeSubVersion === version"
        :title="`V${version}`"
        :count="songs.length"
        :isSubfolder="true"
        @toggle="emit('toggle-subversion', version)"
    >
        <SongItemRow
            v-for="song in songs"
            :key="song.objectID"
            :song="song"
            :activeSongId="activeSongId"
            @add-record="emit('add-record', $event)"
            @add-record-diff="emit('add-record-diff', $event)"
            @toggle-details="emit('toggle-details', $event)"
        />
    </FolderItem>
</template>

<script setup lang="ts">
import { Song } from '@tracker/shared/utils/songDatabase';
import FolderItem from './FolderItem.vue';
import SongItemRow from './SongItemRow.vue';

defineProps<{
    version: string;
    songs: Song[];
    activeSubVersion: string | null;
    activeSongId: string | null;
}>();

const emit = defineEmits(['toggle-subversion', 'add-record', 'add-record-diff', 'toggle-details']);
</script>

<style scoped lang="scss">
</style>
