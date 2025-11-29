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

/**
 * Format a number with thousands separators
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
 */
export function formatNumber(num) {
  if (num == null) return "0";
  return num.toLocaleString();
}

/**
 * Format a percentage value
 * @param {number} value - Value (0-100 or 0-1)
 * @param {boolean} isDecimal - Whether value is decimal (0-1)
 * @returns {string} Formatted percentage string
 */
export function formatPercent(value, isDecimal = false) {
  if (value == null) return "0%";
  const percent = isDecimal ? value * 100 : value;
  return `${Math.round(percent)}%`;
}

/**
 * Calculate win rate from wins and losses
 * @param {number} wins - Number of wins
 * @param {number} losses - Number of losses
 * @returns {number} Win rate as percentage (0-100)
 */
export function calculateWinRate(wins = 0, losses = 0) {
  const total = wins + losses;
  if (total === 0) return 0;
  return Math.round((wins / total) * 100);
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

/**
 * Get initials from a name
 * @param {string} name - Full name
 * @param {number} maxChars - Maximum characters (default: 2)
 * @returns {string} Initials
 */
export function getInitials(name, maxChars = 2) {
  if (!name) return "";
  return name
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, maxChars);
}

export default {
  getRankDisplay,
  formatNumber,
  formatPercent,
  calculateWinRate,
  truncateText,
  getInitials,
};
