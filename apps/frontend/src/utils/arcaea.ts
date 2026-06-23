/**
 * Calculates the play PTT based on the song constant and the player's score.
 * @param constant The constant of the chart.
 * @param score The player's score on the chart.
 * @returns The calculated play PTT, rounded to 4 decimal places.
 */
export const calculatePlayPtt = (constant: number, score: number): number => {
    const fullScore = score > 1005 ? score : score * 10000;
    let ptt = 0;

    if (fullScore >= 10000000) {
        ptt = constant + 2.0;
    } else if (fullScore >= 9800000) {
        ptt = constant + 1.0 + (fullScore - 9800000) / 200000;
    } else {
        ptt = constant + (fullScore - 9500000) / 300000;
    }

    // PTT cannot be negative.
    return Math.max(0, Number(ptt.toFixed(4)));
};

/**
 * Calculates the required score to achieve a target play PTT given a chart constant.
 * @param constant The constant of the chart.
 * @param targetPtt The target play PTT.
 * @returns The required full score (e.g., 9800000), rounded to the nearest integer.
 */
export const calculateScoreFromPtt = (constant: number, targetPtt: number): number => {
    let score = 0;

    if (targetPtt >= constant + 2.0) {
        // PTT is capped at constant + 2.0, which requires 10,000,000 or more.
        score = 10000000;
    } else if (targetPtt >= constant + 1.0) {
        score = 9800000 + (targetPtt - constant - 1.0) * 200000;
    } else {
        score = 9500000 + (targetPtt - constant) * 300000;
    }

    // Score cannot be negative, and in Arcaea, scores are integers.
    return Math.max(0, Math.round(score));
};

// score format