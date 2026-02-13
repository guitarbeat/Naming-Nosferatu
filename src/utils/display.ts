/**
 * @module display
 * @description Display formatting utilities for UI presentation
 */

/**
 * Format rank number with medal emoji for display
 */
export function getRankDisplay(rank: number): string {
	if (rank === 1) {
		return "🥇 1st";
	}
	if (rank === 2) {
		return "🥈 2nd";
	}
	if (rank === 3) {
		return "🥉 3rd";
	}
	if (rank <= 10) {
		return `🏅 ${rank}th`;
	}
	return `${rank}th`;
}
