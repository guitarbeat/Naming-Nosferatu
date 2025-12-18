/**
 * @module logger
 * @description Logging utilities for development and debugging.
 */

const isDev = import.meta.env.DEV;

// * No-op used to strip logging code from production bundles
const noop = (..._args: unknown[]) => { };

/**
 * * Log messages during development only
 * @param args - Arguments to log
 */
export const devLog = isDev
  ? (...args: unknown[]) => {
    // * Log with [DEV] prefix - browser console will handle objects properly
    console.log("[DEV]", ...args);
  }
  : noop;

/**
 * * Log warning messages during development only
 * @param args - Arguments to log
 */
export const devWarn = isDev
  ? (...args: unknown[]) => console.warn("[DEV]", ...args)
  : noop;

/**
 * * Log error messages during development only
 * @param args - Arguments to log
 */
export const devError = isDev
  ? (...args: unknown[]) => console.error("[DEV]", ...args)
  : noop;
