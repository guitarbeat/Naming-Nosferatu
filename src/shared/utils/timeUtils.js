/**
 * @module timeUtils
 * @description Utility functions for time formatting and manipulation.
 */

/**
 * Format a date as relative time (e.g., "just now", "5m ago", "2h ago")
 * @param {Date|string|number} date - Date to format
 * @returns {string} Formatted relative time string
 */
export function formatRelativeTime(date) {
  if (!date) return null;
  
  const now = new Date();
  const then = date instanceof Date ? date : new Date(date);
  const diffSeconds = Math.floor((now - then) / 1000);
  
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
 * Format a duration in milliseconds to human readable string
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration string
 */
export function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export default {
  formatRelativeTime,
  formatDuration,
};
