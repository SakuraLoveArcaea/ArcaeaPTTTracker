<template>
    <div class="search-container">
        <h2 class="title">Arcaea 定數查詢</h2>

        <div class="search-box">
            <input
                v-model="searchQuery"
                @keyup.enter="performSearch"
                type="text"
                placeholder="輸入曲名或別名 (例如: 風暴, GL, tst)..."
            />
            <button @click="performSearch" :disabled="loading">
                {{ loading ? '搜尋中...' : '搜尋' }}
            </button>
        </div>

        <div v-if="hasSearched" class="results-area">
            <table v-if="filteredSongs.length > 0" class="results-table">
                <thead>
                <tr>
                    <th>曲名 (別名)</th>
                    <th>難度與定數</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="song in filteredSongs" :key="song.objectID">
                    <td class="song-title-cell">
                        <div class="song-title">{{ song.title }}</div>

                        <div v-if="song.aliases && song.aliases.length" class="alias-tags">
                <span v-for="alias in song.aliases" :key="alias" class="alias-tag">
                  {{ alias }}
                </span>
                        </div>
                    </td>

                    <td class="song-constants-cell">
                        <div v-for="(constant, diff) in song.constants" :key="diff" class="constant-item">
                            <span :class="['diff-badge', diff]">{{ diff }}</span>
                            <span class="constant-val">{{ Number(constant).toFixed(1) }}</span>
                        </div>
                    </td>
                </tr>
                </tbody>
            </table>

            <div v-else class="no-result">
                找不到相符的歌曲 QAQ
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
// 確保使用 v5 版本的具名匯出
import { algoliasearch } from 'algoliasearch';

// 1. 帶入您的 Application ID 與 Search API Key
const searchClient = algoliasearch('UIKBGM1GZF', 'eb80677b06c782de84ff19151fe82ba0');

const searchQuery = ref('');
const filteredSongs = ref([]);
const hasSearched = ref(false);
const loading = ref(false);

const performSearch = async () => {
    const query = searchQuery.value.trim();
    if (!query) return;

    loading.value = true;
    hasSearched.value = true;

    try {
        // 2. 使用 v5 語法，帶入您的 Index Name 進行搜尋
        const { results } = await searchClient.search({
            requests: [
                {
                    indexName: 'arcaea_constants_ver_6_14',
                    query: query,
                    hitsPerPage: 20, // 限制最多回傳 20 筆，避免畫面過長及浪費流量
                },
            ],
        });

        // 3. 取得 Algolia 雲端回傳的資料
        filteredSongs.value = results[0].hits;

    } catch (error) {
        console.error('Algolia 搜尋失敗:', error);
    } finally {
        loading.value = false;
    }
};
</script>

<style scoped lang="scss">
.search-container {
  max-width: 650px;
  margin: 30px auto;
  color: var(--text-color);
}

.title {
  text-align: center;
  color: var(--text-color);
  margin-bottom: 24px;
}

/* 搜尋框與按鈕 */
.search-box {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
}

.search-box input {
  flex: 1;
  padding: 12px 16px;
  font-size: 16px;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  color: var(--text-color);
  border-radius: 8px;
  outline: none;
  transition: all 0.3s ease;

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
}

.search-box button {
  padding: 0 24px;
  font-size: 16px;
  font-weight: bold;
  background-color: var(--primary);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:disabled {
    background-color: var(--text-muted);
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background-color: var(--primary-hover);
  }
}

/* 表格樣式 */
.results-table {
  width: 100%;
  border-collapse: collapse;
  background-color: var(--bg-card);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--border-color);
  box-shadow: var(--card-shadow);
  border-radius: 8px;
  overflow: hidden;
}

.results-table th, .results-table td {
  padding: 14px 20px;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-color);
}

.results-table th {
  background-color: var(--dialog-header-bg);
  color: var(--text-muted);
  font-weight: 600;
}

.results-table tbody tr:hover {
  background-color: rgba(59, 130, 246, 0.04);
}

/* 曲名與別名 */
.song-title {
  font-weight: 600;
  font-size: 16px;
  color: var(--text-color);
}

.alias-tags {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.alias-tag {
  font-size: 12px;
  background-color: var(--options-bg);
  color: var(--options-text);
  padding: 2px 8px;
  border-radius: 12px;
}

/* 難度與定數區塊 */
.constant-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;

  &:last-child {
    margin-bottom: 0;
  }
}

.diff-badge {
  display: inline-block;
  width: 40px;
  text-align: center;
  font-size: 12px;
  font-weight: bold;
  padding: 3px 0;
  border-radius: 4px;
  color: white;
}

/* Arcaea 難度專屬顏色 */
.PST { background-color: #4da6ff; }
.PRS { background-color: #66cc66; }
.FTR { background-color: #a366ff; }
.BYD { background-color: #ff4d4d; }
.ETR { background-color: #b5a1c9; }

.constant-val {
  font-family: 'Courier New', Courier, monospace;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-color);
}

/* 無結果提示 */
.no-result {
  text-align: center;
  padding: 40px;
  color: var(--text-muted);
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: var(--card-shadow);
}
</style>