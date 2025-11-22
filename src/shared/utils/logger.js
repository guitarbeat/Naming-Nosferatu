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
