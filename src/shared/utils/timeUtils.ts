/**
 * @module timeUtils
 * @description Utility functions for time formatting and manipulation.
 */

/**
 * Format a date as relative time (e.g., "just now", "5m ago", "2h ago")
 * @param {Date|string|number} date - Date to format
 * @returns {string} Formatted relative time string
 */
export function formatRelativeTime(date: Date | string | number) {
  if (!date) return null;

  const now = new Date();
  const then = date instanceof Date ? date : new Date(date);
  const diffSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffSeconds < 10) return "just now";
  if (diffSeconds < 60) return `${diffSeconds}s ago`;

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  // Fall back to locale time for older dates
  return then.toLocaleDateString();
}

/**
 * Format a date to locale date string
 * @param {Date|string|number} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {},
) {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString(undefined, options);
}
