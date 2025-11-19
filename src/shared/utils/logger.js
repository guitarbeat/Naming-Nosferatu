/**
 * @module logger
 * @description Logging utilities for development and debugging.
 */

/**
 * * Log messages during development only
 * @param {...any} args - Arguments to log
 */
export function devLog(...args) {
  try {
    if (process.env.NODE_ENV !== "production") {
      console.log("[DEV]", ...args);
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Logger error:", error);
    }
  }
}

/**
 * * Structured logger for better debugging
 */
export const Logger = {
  /**
   * * Log info messages
   * @param {string} category - Log category (e.g., 'API', 'UI', 'State')
   * @param {string} message - Log message
   * @param {Object} data - Additional data to log
   */
  info: (category, message, data = {}) => {
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[INFO:${category}]`,
        message,
        Object.keys(data).length > 0 ? data : "",
      );
    }
  },

  /**
   * * Log warning messages
   * @param {string} category - Log category
   * @param {string} message - Warning message
   * @param {Object} data - Additional data
   */
  warn: (category, message, data = {}) => {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[WARN:${category}]`,
        message,
        Object.keys(data).length > 0 ? data : "",
      );
    }
  },

  /**
   * * Log error messages
   * @param {string} category - Log category
   * @param {string} message - Error message
   * @param {Error|Object} error - Error object or data
   */
  error: (category, message, error = {}) => {
    if (process.env.NODE_ENV === "development") {
      console.error(`[ERROR:${category}]`, message, error);
    }
  },

  /**
   * * Log debug messages (more verbose)
   * @param {string} category - Log category
   * @param {string} message - Debug message
   * @param {Object} data - Additional data
   */
  debug: (category, message, data = {}) => {
    if (
      process.env.NODE_ENV === "development" &&
      process.env.REACT_APP_DEBUG === "true"
    ) {
      console.debug(
        `[DEBUG:${category}]`,
        message,
        Object.keys(data).length > 0 ? data : "",
      );
    }
  },

  /**
   * * Log performance metrics
   * @param {string} operation - Operation name
   * @param {number} duration - Duration in milliseconds
   * @param {Object} metadata - Additional metadata
   */
  performance: (operation, duration, metadata = {}) => {
    if (process.env.NODE_ENV === "development") {
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        );
      console.log(
        `[PERF${isMobile ? ":MOBILE" : ""}]`,
        `${operation}: ${duration.toFixed(2)}ms`,
        Object.keys(metadata).length > 0 ? metadata : "",
      );
    }
  },

  /**
   * * Group related logs
   * @param {string} label - Group label
   * @param {Function} fn - Function to execute within group
   */
  group: (label, fn) => {
    if (process.env.NODE_ENV === "development") {
      console.group(label);
      try {
        fn();
      } finally {
        console.groupEnd();
      }
    } else {
      fn();
    }
  },
};
