/**
 * @module displayUtils
 * @description Utility functions for display formatting and visual elements.
 */

/**
 * Get rank emoji for top 3 positions
 * @param {number} rank - Position (1-based)
 * @returns {string|number} Emoji for top 3, or the rank number
 */
export function getRankDisplay(rank: number): string {
  if (rank === 1) return "🥇 1st";
  if (rank === 2) return "🥈 2nd";
  if (rank === 3) return "🥉 3rd";
  if (rank <= 10) return `🏅 ${rank}th`;
  return `${rank}th`;
}
