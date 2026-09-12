import { type Record } from './record';

/**
 * PTT 計算策略介面
 * 透過策略模式，讓 B30 與 B50 模式共用相同的呼叫介面。
 */
export interface PttStrategy {
    /** 策略識別名稱 */
    readonly name: 'B30' | 'B50';
    /** 取前幾名計算（B30=30, B50=50） */
    readonly topN: number;
    /** 通關獎勵加成（B30=0, B50=0.2） */
    readonly clearBonus: number;
    /**
     * 計算某筆紀錄的「有效單曲 PTT」（用於圖表顯示與整體計算）
     * B30: 直接回傳 record.playPtt
     * B50: record.playPtt + clearBonus
     */
    effectivePtt(record: Record): number;
    /**
     * 計算整體 PTT 統計數值
     * @param records 全部紀錄（已按 playPtt 降序排序）
     */
    calcOverallPtt(records: Record[]): {
        mainAvg: number;
        subAvg: number;
        overall: number;
    };
    /** 主要區間標籤，用於 NavStats 顯示 */
    readonly mainLabel: string;
    /** 次要區間標籤，用於 NavStats 顯示 */
    readonly subLabel: string;
}

// ─── B30 策略（原始 Arcaea 公式）────────────────────────────────────────────

/**
 * 傳統 B30 + R10 計算策略。
 * 整體 PTT = (B30 × 30 + R10 × 10) / 40
 */
export const B30Strategy: PttStrategy = {
    name: 'B30',
    topN: 30,
    clearBonus: 0,
    mainLabel: 'B30 平均',
    subLabel: '最高 R10 平均',

    effectivePtt(record: Record): number {
        return record.playPtt;
    },

    calcOverallPtt(records: Record[]) {
        if (records.length === 0) return { mainAvg: 0, subAvg: 0, overall: 0 };

        const top30 = records.slice(0, 30);
        const top10 = records.slice(0, 10);

        const mainAvg = top30.reduce((s, r) => s + this.effectivePtt(r), 0) / 30;
        const subAvg  = top10.reduce((s, r) => s + this.effectivePtt(r), 0) / (top10.length === 10 ? 10 : top10.length);
        const overall = (mainAvg * 30 + subAvg * 10) / 40;

        return { mainAvg, subAvg, overall };
    }
};

// ─── B50 策略（含通關獎勵的新公式）──────────────────────────────────────────

/**
 * 新 B50 + B10 計算策略。
 * 單曲有效 PTT = playPtt + 0.200（預設通關獎勵）
 * 整體 PTT = (B50 總和 + B10 總和) / 60
 */
export const B50Strategy: PttStrategy = {
    name: 'B50',
    topN: 50,
    clearBonus: 0.2,
    mainLabel: 'B50 平均',
    subLabel: '最高 B10 平均',

    effectivePtt(record: Record): number {
        const rawPtt = Number(record.playPtt) || 0;
        return Math.round((rawPtt + this.clearBonus) * 10000) / 10000;
    },

    calcOverallPtt(records: Record[]) {
        if (records.length === 0) return { mainAvg: 0, subAvg: 0, overall: 0 };

        const sorted = [...records].sort((a, b) => this.effectivePtt(b) - this.effectivePtt(a));
        const top50 = sorted.slice(0, 50);
        const top10 = sorted.slice(0, 10);

        const b50Sum = top50.reduce((s, r) => s + this.effectivePtt(r), 0);
        const b10Sum = top10.reduce((s, r) => s + this.effectivePtt(r), 0);

        const mainAvg = b50Sum / (top50.length || 1);
        const subAvg  = b10Sum / (top10.length || 1);
        const overall = (b50Sum + b10Sum) / 60;

        return { mainAvg, subAvg, overall };
    }
};

// ─── 輔助：依模式名稱取得策略 ────────────────────────────────────────────────

export const getPttStrategy = (mode: 'b30' | 'b50'): PttStrategy =>
    mode === 'b50' ? B50Strategy : B30Strategy;
