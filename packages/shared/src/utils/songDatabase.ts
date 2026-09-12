import { algoliasearch } from 'algoliasearch';
import Fuse from 'fuse.js';
import { Difficulty, BaseDifficulty, ExtraDifficultyType } from './record';

/** 附加難度譜面物件 */
export interface ExtraChart {
    type: ExtraDifficultyType; // 難度類別，例如 "INS", "BYD", "ETR", "BYD1", "BYD2"
    level: string;             // 難度等級，例如 "11", "12", "9+"
    constant?: number;         // 定數數值，例如 11.4, 12.0 (若已知)
    name?: string;             // 特殊譜面名稱 (例如 Last 的 "Moment" / "Eternity")
}

/** 單首曲目資料結構 */
export interface Song {
    objectID?: string;                                 // Algolia 搜尋唯一 ID (同 title)
    title: string;                                     // 曲名
    composer: string;                                  // 曲師名稱
    pack: string;                                      // 所屬曲包 (例如 "Divine Oblivion", "Arcaea")
    bpm: string;                                       // 曲目 BPM (例如 "190", "75 - 210")
    duration: string;                                  // 曲目時長 (格式 "MM:SS")
    levels: Record<BaseDifficulty, string> & Partial<Record<ExtraDifficultyType, string>>; // 各難度等級
    constants: Partial<Record<Difficulty, number>>;    // 各難度定數
    extra: ExtraChart | null;                          // 主要附加難度 (無附加難度時為 null)
    extras: ExtraChart[];                              // 附加難度列表 (通常為 0 或 1 筆，Last 為 2 筆)
    aliases: string[];                                 // 搜尋別名列表 (例如 ["Last | Moment", "Last | Eternity"])
    version_added: string;                             // 首次加入遊戲之版本號 (例如 "7.0.0", "1.0.5")
    diff_updates?: Record<string, string>;             // 各難度追加版本記錄 (例如 {"ETR": "5.4.0"})
    
    // 扁平化後的輔助欄位，用來加強搜尋
    flatConstants?: string[];
    flatLevels?: string[];
    flatDifficulties?: string[];
}

export type ArcaeaSong = Song;

/** 完整輸出 JSON 根結構 */
export interface ArcaeaDatabaseExport {
    version: string;     // 資料版本號 (例如 "v7.0")
    updated_at: string;  // 匯出時間 (格式 "YYYY-MM-DD HH:MM:SS")
    total_count: number; // 總曲目數
    songs: ArcaeaSong[]; // 曲目清單
}

const CACHE_KEY = 'arcaea_cached_songs_v3';
const CACHE_TIME_KEY = 'arcaea_cached_songs_time_v3';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 快取 24 小時

let cachedSongs: Song[] = [];
let fuseInstance: Fuse<Song> | null = null;
let isFetching = false;
let fetchPromise: Promise<Song[]> | null = null;

const searchClient = algoliasearch('UIKBGM1GZF', 'eb80677b06c782de84ff19151fe82ba0');

/**
 * 建立 Fuse 實例
 */
function initFuseInstance(songs: Song[]) {
    fuseInstance = new Fuse(songs, {
        keys: [
            { name: 'title', weight: 0.35 },
            { name: 'aliases', weight: 0.35 },
            { name: 'composer', weight: 0.15 },
            { name: 'pack', weight: 0.1 },
            { name: 'bpm', weight: 0.05 },
            { name: 'version_added', weight: 0.05 },
            { name: 'flatConstants', weight: 0.15 },
            { name: 'flatLevels', weight: 0.1 },
            { name: 'flatDifficulties', weight: 0.05 }
        ],
        threshold: 0.35, // 拼寫容錯閾值，調低使其搜尋更精準
        ignoreLocation: true, // 忽略關鍵字在字串中的位置限制
        useExtendedSearch: true, // 支援空格分詞
    });
}

/**
 * 嘗試自 localStorage 讀取本地快取的曲庫資料
 */
function loadLocalCache(): boolean {
    if (typeof localStorage === 'undefined') return false;
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return false;
        const parsed = JSON.parse(raw) as Song[];
        if (Array.isArray(parsed) && parsed.length > 0) {
            cachedSongs = parsed;
            initFuseInstance(cachedSongs);
            return true;
        }
    } catch (e) {
        console.warn('讀取曲庫本機快取失敗:', e);
    }
    return false;
}

// 模組加載時立即嘗試讀取本地快取（0 延遲）
loadLocalCache();

/**
 * 載入並快取所有曲目資料，優先自本地快取讀取，並在過期時自動非同步更新
 */
export async function fetchAllSongs(forceRefresh = false): Promise<Song[]> {
    const hasCache = cachedSongs.length > 0 || loadLocalCache();
    
    // 檢查本地快取是否仍處於有效期
    let isCacheFresh = false;
    if (typeof localStorage !== 'undefined') {
        const savedTime = parseInt(localStorage.getItem(CACHE_TIME_KEY) || '0', 10);
        isCacheFresh = Date.now() - savedTime < CACHE_TTL_MS;
    }

    // 如果快取有效且未強制刷新，直接回傳本地資料 (0ms 瞬間響應)
    if (hasCache && isCacheFresh && !forceRefresh) {
        return cachedSongs;
    }

    // 如果已有請求在進行中，共用該 Promise
    if (isFetching && fetchPromise) {
        return fetchPromise;
    }

    isFetching = true;
    fetchPromise = (async () => {
        try {
            const { results } = await searchClient.search({
                requests: [
                    {
                        indexName: 'arcaea_songs',
                        query: '',
                        hitsPerPage: 1000,
                    },
                ],
            });
            const searchResult = results[0];
            if (searchResult && 'hits' in searchResult) {
                const hits = searchResult.hits as unknown as any[];
                cachedSongs = hits.map(item => {
                    const levels = { ...(item.levels || {}) };
                    const constants = { ...(item.constants || {}) };
                    
                    let extras: ExtraChart[] = [];
                    if (Array.isArray(item.extras)) {
                        extras = item.extras;
                    } else if (item.extra) {
                        extras = [item.extra];
                    }
                    
                    // 將 extras 中的難度合併進 levels 與 constants
                    extras.forEach((ec: ExtraChart) => {
                        if (ec && ec.type) {
                            if (ec.level && !levels[ec.type]) {
                                levels[ec.type] = ec.level;
                            }
                            if (typeof ec.constant === 'number' && constants[ec.type] === undefined) {
                                constants[ec.type] = ec.constant;
                            }
                        }
                    });

                    // 扁平化定數 (如 2.0 扁平化成 ["2", "2.0"])
                    const flatConstants = Object.values(constants).flatMap((c: any) => {
                        if (c === undefined || c === null) return [];
                        const str = String(c);
                        const fixed = typeof c === 'number' ? c.toFixed(1) : '';
                        return fixed && fixed !== str ? [str, fixed] : [str];
                    });

                    const flatLevels = Object.values(levels).filter(Boolean).map(String);
                    const flatDifficulties = Object.keys(constants);

                    return {
                        ...item,
                        objectID: item.objectID || item.title,
                        levels,
                        constants,
                        extra: item.extra || (extras.length > 0 ? extras[0] : null),
                        extras,
                        aliases: Array.isArray(item.aliases) ? item.aliases : [],
                        flatConstants,
                        flatLevels,
                        flatDifficulties,
                    } as Song;
                });

                // 初始化 Fuse 實例
                initFuseInstance(cachedSongs);

                // 持久化寫入 localStorage
                if (typeof localStorage !== 'undefined') {
                    try {
                        localStorage.setItem(CACHE_KEY, JSON.stringify(cachedSongs));
                        localStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
                    } catch (err) {
                        console.warn('寫入曲庫本機快取失敗:', err);
                    }
                }
            }
        } catch (error) {
            console.error('無法從 Algolia 獲取曲目列表:', error);
            // 發生網路錯誤時，若有過期快取仍退回使用
            if (cachedSongs.length === 0) {
                loadLocalCache();
            }
        } finally {
            isFetching = false;
            fetchPromise = null;
        }
        return cachedSongs;
    })();

    // 若本地已有舊資料且非強制更新，可立即回傳舊資料，讓 Algolia 請求在背景執行 (SWR 模式)
    if (hasCache && !forceRefresh) {
        return cachedSongs;
    }

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
                        { version_added: token },
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
