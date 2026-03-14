/**
 * Calculates the play PTT based on the song constant and the player's score.
 * @param constant The constant of the chart.
 * @param score The player's score on the chart.
 * @returns The calculated play PTT, rounded to 4 decimal places.
 */
export const calculatePlayPtt = (constant: number, score: number): number => {
    // If score is in the format of 993.9932, convert it to 9939932
    const fullScore = score > 1005 ? score : score * 10000;
    let ptt = 0;

    if (fullScore >= 10000000) {
        // PM
        ptt = constant + 2.0;
    } else if (fullScore >= 9800000) {
        // EX+
        ptt = constant + 1.0 + (fullScore - 9800000) / 200000;
    } else {
        // EX and below
        // Note: Arcaea official formula is not public for scores below 9.8m,
        // this is a widely accepted approximation.
        ptt = constant + (fullScore - 9500000) / 300000;
    }

    // PTT cannot be negative.
    return Math.max(0, Number(ptt.toFixed(4)));
};
