import { algoliasearch } from 'algoliasearch';
import Fuse from 'fuse.js';

export interface Song {
    title: string;
    composer: string;
    pack: string;
    bpm: string;
    duration: string;
    version: string;
    levels: Record<string, string>;
    constants: Record<string, number>;
    aliases: string[];
    objectID: string;
    
    // 扁平化後的輔助欄位，用來加強搜尋
    flatConstants?: string[];
    flatLevels?: string[];
    flatDifficulties?: string[];
}

let cachedSongs: Song[] = [];
let fuseInstance: Fuse<Song> | null = null;
let isFetching = false;
let fetchPromise: Promise<Song[]> | null = null;

const searchClient = algoliasearch('UIKBGM1GZF', 'eb80677b06c782de84ff19151fe82ba0');

/**
 * 載入並快取所有曲目資料，並初始化 Fuse.js
 */
export async function fetchAllSongs(): Promise<Song[]> {
    if (cachedSongs.length > 0) {
        return cachedSongs;
    }
    
    if (isFetching && fetchPromise) {
        return fetchPromise;
    }
    
    isFetching = true;
    fetchPromise = (async () => {
        try {
            const { results } = await searchClient.search({
                requests: [
                    {
                        indexName: 'arcaea_constants_ver_6_14_11',
                        query: '',
                        hitsPerPage: 1000,
                    },
                ],
            });
            const searchResult = results[0];
            if (searchResult && 'hits' in searchResult) {
                const hits = searchResult.hits as unknown as Song[];
                cachedSongs = hits.map(song => {
                    const constants = song.constants || {};
                    const levels = song.levels || {};
                    
                    // 扁平化定數 (如 2.0 扁平化成 ["2", "2.0"])
                    const flatConstants = Object.values(constants).flatMap(c => {
                        const str = String(c);
                        const fixed = typeof c === 'number' ? c.toFixed(1) : '';
                        return fixed && fixed !== str ? [str, fixed] : [str];
                    });

                    const flatLevels = Object.values(levels).map(String);
                    const flatDifficulties = Object.keys(constants);

                    return {
                        ...song,
                        flatConstants,
                        flatLevels,
                        flatDifficulties,
                    };
                });

                // 初始化 Fuse 實例
                fuseInstance = new Fuse(cachedSongs, {
                    keys: [
                        { name: 'title', weight: 0.35 },
                        { name: 'aliases', weight: 0.35 },
                        { name: 'composer', weight: 0.15 },
                        { name: 'pack', weight: 0.1 },
                        { name: 'bpm', weight: 0.05 },
                        { name: 'version', weight: 0.05 },
                        { name: 'flatConstants', weight: 0.15 },
                        { name: 'flatLevels', weight: 0.1 },
                        { name: 'flatDifficulties', weight: 0.05 }
                    ],
                    threshold: 0.35, // 拼寫容錯閾值，調低使其搜尋更精準
                    ignoreLocation: true, // 忽略關鍵字在字串中的位置限制
                    useExtendedSearch: true, // 支援空格分詞
                });
            }
        } catch (error) {
            console.error('無法從 Algolia 獲取曲目列表:', error);
        } finally {
            isFetching = false;
            fetchPromise = null;
        }
        return cachedSongs;
    })();

    return fetchPromise;
}

/**
 * 本地模糊搜尋曲目
 */
export async function searchSongs(query: string): Promise<Song[]> {
    const trimmed = query.trim();
    if (!trimmed) {
        return [];
    }

    // 確保曲目已載入且 Fuse 實例已就緒
    if (!fuseInstance) {
        await fetchAllSongs();
    }

    if (fuseInstance) {
        // 將空格分隔的搜尋詞轉換為 Fuse.js 的 AND 模式，以進行更精確的組合查詢
        const tokens = trimmed.split(/\s+/).filter(Boolean);
        if (tokens.length > 1) {
            const logicalQuery = {
                $and: tokens.map(token => ({
                    $or: [
                        { title: token },
                        { aliases: token },
                        { composer: token },
                        { pack: token },
                        { bpm: token },
                        { version: token },
                        { flatConstants: token },
                        { flatLevels: token },
                        { flatDifficulties: token }
                    ]
                }))
            };
            const results = fuseInstance.search(logicalQuery);
            return results.slice(0, 8).map(res => res.item);
        } else {
            const results = fuseInstance.search(trimmed);
            return results.slice(0, 8).map(res => res.item);
        }
    }

    return [];
}
