/**
 * @module displayUtils
 * @description Utility functions for display formatting and visual elements.
 */

/**
 * Get rank emoji for top 3 positions
 * @param {number} rank - Position (1-based)
 * @returns {string|number} Emoji for top 3, or the rank number
 */
export function getRankDisplay(rank) {
  switch (rank) {
    case 1:
      return "🥇";
    case 2:
      return "🥈";
    case 3:
      return "🥉";
    default:
      return rank;
  }
}

// Unused utility functions removed:
// - formatNumber
// - formatPercent
// - calculateWinRate
// - truncateText
// - getInitials

// Default export removed - use named exports instead
// export default {
//   getRankDisplay,
//   formatNumber,
//   formatPercent,
//   calculateWinRate,
//   truncateText,
//   getInitials,
// };
