<template>
    <Dialog 
        v-model:visible="UIStore.isScoreInputDialogOpen" 
        modal 
        position="bottom" 
        :style="{ width: '100vw', maxWidth: '420px', margin: '0' }"
        :showHeader="false"
        class="score-input-dialog"
    >
        <div class="score-input-container">
            <!-- Header 曲目資訊 -->
            <div class="dialog-header-mini">
                <span class="dialog-title">更新遊玩分數</span>
                <span class="song-info" v-if="record">
                    {{ record.title }}
                    <span class="diff-tag" :style="{ backgroundColor: diffColors[record.difficulty] }">
                        {{ record.difficulty }}
                    </span>
                </span>
                <span class="constant-info" v-if="record">
                    定數: {{ record.constant.toFixed(1) }}
                </span>
            </div>

            <!-- 覆蓋型數字顯示槽 (passcode style) -->
            <div class="slots-panel" :class="{ 'pm-mode-active': isPmMode }">
                <div class="panel-top-row">
                    <div class="realtime-ptt" v-if="record">
                        單曲 PTT: <span class="ptt-val">{{ playPtt.toFixed(4) }}</span>
                    </div>
                </div>
                
                <div class="slots-row-wrapper">
                    <!-- PM 模式下的靜態前綴與 4 位數尾數 -->
                    <template v-if="isPmMode">
                        <div class="static-prefix">1000</div>
                        <div class="dot-separator">.</div>
                        <div class="slots-group">
                            <div 
                                v-for="idx in [0, 1, 2, 3]" 
                                :key="idx" 
                                class="digit-slot pm-slot" 
                                :class="{ 'active': cursorIndex === idx }"
                                @click="cursorIndex = idx"
                            >
                                {{ digitsArray[idx] }}
                            </div>
                        </div>
                    </template>
                    
                    <!-- 一般模式下的 7 位數分組 -->
                    <template v-else>
                        <div class="slots-group">
                            <div 
                                v-for="idx in [0, 1, 2]" 
                                :key="idx" 
                                class="digit-slot" 
                                :class="{ 'active': cursorIndex === idx }"
                                @click="cursorIndex = idx"
                            >
                                {{ digitsArray[idx] }}
                            </div>
                        </div>
                        <div class="dot-separator">.</div>
                        <div class="slots-group">
                            <div 
                                v-for="idx in [3, 4, 5, 6]" 
                                :key="idx" 
                                class="digit-slot" 
                                :class="{ 'active': cursorIndex === idx }"
                                @click="cursorIndex = idx"
                            >
                                {{ digitsArray[idx] }}
                            </div>
                        </div>
                    </template>
                </div>

                <div class="score-mode-badge" v-if="isPmMode">
                    PM 快捷模式 (請輸入 4 位尾數)
                </div>
                <div class="score-mode-badge normal-badge" v-else>
                    7 位數模式 (點擊數字槽可移動底線)
                </div>
            </div>

            <!-- 3x4 數字鍵盤 -->
            <div class="keypad-grid">
                <button v-for="n in 9" :key="n" class="keypad-btn" @click="pressDigit(n.toString())">
                    {{ n }}
                </button>
                <button class="keypad-btn reset-btn" @click="pressClear">
                    重新輸入
                </button>
                <button class="keypad-btn" @click="pressDigit('0')">
                    0
                </button>
                <button class="keypad-btn pm-btn" :class="{ 'active-pm': isPmMode }" @click="pressPmShortcut">
                    PM
                </button>
            </div>

            <!-- 底部動作按鈕 -->
            <div class="action-footer">
                <Button label="取消" outlined severity="secondary" @click="onCancel" class="footer-btn" />
                <Button label="確認修改" severity="primary" @click="onConfirm" class="footer-btn" />
            </div>
        </div>
    </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';
import { useUIStore } from '@/stores/uiStore';
import { Difficulty } from '@/utils/record';
import { calculatePlayPtt } from '@/utils/arcaeaRule';

const UIStore = useUIStore();
const toast = useToast();

const record = computed(() => UIStore.scoreInputRecord);
// 即時計算單曲 Play PTT
const playPtt = computed(() => {
    if (!record.value) return 0;
    const parsed = getParsedScore();
    if (parsed === null || isNaN(parsed)) return 0;
    return calculatePlayPtt(record.value.constant, parsed);
});

// 儲存當前與原始位數的陣列。一般模式下長度為 7，PM 模式下長度為 4
const digitsArray = ref<string[]>(['0', '0', '0', '0', '0', '0', '0']);
const originalDigits = ref<string[]>(['0', '0', '0', '0', '0', '0', '0']);
const originalPmMode = ref(false);
const cursorIndex = ref(0);
const isPmMode = ref(false);

const diffColors: Record<Difficulty, string> = {
    'PST': '#5aa1d9',
    'PRS': '#81b144',
    'FTR': '#a155ab',
    'BYD': '#d63d41',
    'ETR': '#c4a1d1'
};

// 監聽對話框打開，預填分數與備份原始分數
watch(() => UIStore.isScoreInputDialogOpen, (newVal) => {
    if (newVal && record.value) {
        const scoreVal = record.value.score;
        // 將分數還原為整數分值
        const fullScore = Math.round(scoreVal > 1005 ? scoreVal : scoreVal * 10000);
        
        if (fullScore >= 10000000) {
            isPmMode.value = true;
            originalPmMode.value = true;
            const suffixVal = fullScore - 10000000;
            const suffixStr = suffixVal.toString().padStart(4, '0');
            digitsArray.value = suffixStr.split('');
            originalDigits.value = [...digitsArray.value];
            cursorIndex.value = 0; // PM 模式下可編輯位數為 4 位 (index 0, 1, 2, 3)
        } else {
            isPmMode.value = false;
            originalPmMode.value = false;
            const scoreStr = fullScore.toString().padStart(7, '0');
            digitsArray.value = scoreStr.split('');
            originalDigits.value = [...digitsArray.value];
            cursorIndex.value = 0; // 一般模式下可編輯位數為 7 位 (index 0 到 6)
        }
    } else {
        resetToZero();
    }
});

const resetToZero = () => {
    isPmMode.value = false;
    originalPmMode.value = false;
    digitsArray.value = ['0', '0', '0', '0', '0', '0', '0'];
    originalDigits.value = ['0', '0', '0', '0', '0', '0', '0'];
    cursorIndex.value = 0;
};

// 點擊數字
const pressDigit = (digit: string) => {
    digitsArray.value[cursorIndex.value] = digit;
    
    // 自動前進游標
    const maxIndex = isPmMode.value ? 3 : 6;
    if (cursorIndex.value < maxIndex) {
        cursorIndex.value++;
    }
};

// 重新輸入 (還原為本次編輯前的原始分數，而不是全歸零)
const pressClear = () => {
    if (record.value) {
        digitsArray.value = [...originalDigits.value];
        isPmMode.value = originalPmMode.value;
        cursorIndex.value = 0;
    } else {
        resetToZero();
    }
};

// 快捷 PM 按鈕 (切換到 PM 模式，前綴設為 1000，並開啟 4 位尾數編輯)
const pressPmShortcut = () => {
    isPmMode.value = true;
    digitsArray.value = ['0', '0', '0', '0'];
    cursorIndex.value = 0;
};

const onCancel = () => {
    UIStore.isScoreInputDialogOpen = false;
    UIStore.scoreInputRecord = null;
};

// 解析當前輸入的分數為浮點數型態
const getParsedScore = (): number => {
    if (isPmMode.value) {
        const suffix = digitsArray.value.join('');
        return parseFloat(`1000.${suffix}`);
    } else {
        const part1 = digitsArray.value.slice(0, 3).join('');
        const part2 = digitsArray.value.slice(3, 7).join('');
        return parseFloat(`${part1}.${part2}`);
    }
};

const emit = defineEmits<{
    (e: 'save', payload: { id: string, score: number }): void;
}>();

const onConfirm = () => {
    const parsed = getParsedScore();

    if (parsed < 0 || parsed > 1005) {
        toast.add({
            severity: 'error',
            summary: '分數超出範圍',
            detail: '分數轉換後須介於 0.0000 與 1005.0000 之間！',
            life: 3000
        });
        return;
    }

    if (record.value) {
        emit('save', {
            id: record.value.id,
            score: parsed
        });
        UIStore.isScoreInputDialogOpen = false;
        UIStore.scoreInputRecord = null;
    }
};
</script>

<style scoped lang="scss">
.score-input-container {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: 0.5rem 0.25rem;
}

.dialog-header-mini {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    align-items: center;
    text-align: center;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.75rem;

    .dialog-title {
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--text-color);
    }

    .song-info {
        font-size: 0.85rem;
        color: var(--text-muted);
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .constant-info {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-muted);
        opacity: 0.85;
    }

    .diff-tag {
        font-size: 0.7rem;
        font-weight: 800;
        color: white;
        padding: 0.05rem 0.35rem;
        border-radius: 4px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    }
}

/* 覆蓋型數字顯示槽 (passcode style) */
.slots-panel {
    background: rgba(0, 0, 0, 0.15);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 1.25rem 0.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-height: 90px;
    width: 100%;
    box-sizing: border-box;

    &.pm-mode-active {
        border-color: rgba(245, 158, 11, 0.3);
        background: rgba(245, 158, 11, 0.05);
    }
}

.panel-top-row {
    display: flex;
    justify-content: center;
    width: 100%;
    align-items: center;
    padding: 0 0.25rem;
    box-sizing: border-box;
}

.realtime-ptt {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-muted);
    
    .ptt-val {
        font-family: 'Courier New', Courier, monospace;
        color: #3b82f6;
        font-size: 0.85rem;
        font-weight: 700;
    }
}

.score-label {
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--text-muted);
    letter-spacing: 0.15em;
}

.slots-row-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    width: 100%;
    max-width: 100%;
}

.static-prefix {
    font-family: 'Courier New', Courier, monospace;
    font-size: 1.5rem;
    font-weight: 700;
    color: #f59e0b;
    letter-spacing: 0.05em;
    padding: 0 0.1rem;
    display: flex;
    align-items: center;
    height: 40px;
}

.slots-group {
    display: flex;
    gap: 0.25rem;
}

.digit-slot {
    width: 30px;
    height: 40px;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-bottom: 3px solid var(--border-color);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Courier New', Courier, monospace;
    font-size: 1.35rem;
    font-weight: 700;
    color: var(--text-color);
    cursor: pointer;
    user-select: none;
    transition: all 0.2s ease;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;

    &.active {
        border-color: #3b82f6 !important;
        border-bottom-width: 3px !important;
        background: rgba(59, 130, 246, 0.08) !important;
        box-shadow: 0 0 6px rgba(59, 130, 246, 0.15);
        transform: translateY(-2px);
    }

    &.pm-slot {
        border-color: rgba(245, 158, 11, 0.25);
        
        &.active {
            border-color: #f59e0b !important;
            background: rgba(245, 158, 11, 0.08) !important;
            box-shadow: 0 0 6px rgba(245, 158, 11, 0.15);
        }
    }
}

.dot-separator {
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--text-color);
    padding: 0 0.05rem;
    line-height: 1;
    display: flex;
    align-items: flex-end;
    height: 30px;
}

.score-mode-badge {
    font-size: 0.75rem;
    color: #3b82f6;
    font-weight: 600;
    
    &.normal-badge {
        color: var(--text-muted);
    }
}

/* 數字鍵盤 Grid */
.keypad-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
    width: 100%;
}

.keypad-btn {
    height: 54px;
    border-radius: 10px;
    border: 1px solid var(--border-color);
    background: var(--bg-card);
    color: var(--text-color);
    font-size: 1.35rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;

    &:active {
        transform: scale(0.95);
        background: var(--options-bg);
        border-color: rgba(59, 130, 246, 0.3);
    }

    &.reset-btn {
        font-size: 0.95rem;
        color: var(--text-muted);
        font-weight: 600;

        &:active {
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
        }
    }

    &.pm-btn {
        font-size: 1.15rem;
        color: #3b82f6;
        font-weight: 700;

        &:active, &.active-pm {
            background: rgba(59, 130, 246, 0.15);
            border-color: rgba(59, 130, 246, 0.4);
            color: #3b82f6;
        }
    }
}

/* 底部動作區 */
.action-footer {
    display: flex;
    gap: 0.75rem;
    width: 100%;
    margin-top: 0.5rem;
}

.footer-btn {
    flex: 1;
    font-weight: 700 !important;
}
</style>
