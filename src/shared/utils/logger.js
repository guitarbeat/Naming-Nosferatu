/**
 * @module logger
 * @description Logging utilities for development and debugging.
 */

const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;

// * No-op used to strip logging code from production bundles
const noop = () => { };

/**
 * * Log messages during development only
 * @param {...any} args - Arguments to log
 */
export const devLog = isDev
  ? (...args) => {
    // * Log with [DEV] prefix - browser console will handle objects properly
    console.log("[DEV]", ...args);
  }
  : noop;

/**
 * * Log warning messages during development only
 * @param {...any} args - Arguments to log
 */
export const devWarn = isDev ? (...args) => console.warn("[DEV]", ...args) : noop;

/**
 * * Log error messages during development only
 * @param {...any} args - Arguments to log
 */
export const devError = isDev ? (...args) => console.error("[DEV]", ...args) : noop;

/**
 * * Log info messages during development only
 * @param {...any} args - Arguments to log
 */
export const devInfo = isDev ? (...args) => console.info("[DEV]", ...args) : noop;

/**
 * * Log debug messages during development only
 * @param {...any} args - Arguments to log
 */
export const devDebug = isDev ? (...args) => console.debug("[DEV]", ...args) : noop;

/**
 * * Execute a callback only in development mode
 * @param {Function} callback - Function to execute
 */
export function devOnly(callback) {
  if (isDev && typeof callback === "function") {
    callback();
  }
}

/**
 * * Create a namespaced logger for a specific module
 * @param {string} namespace - Module name for prefixing logs
 * @returns {Object} Logger object with log, warn, error, info, debug methods
 */
export function createLogger(namespace) {
  const prefix = `[${namespace}]`;

  return {
    log: isDev ? (...args) => console.log(prefix, ...args) : noop,
    warn: isDev ? (...args) => console.warn(prefix, ...args) : noop,
    error: isDev ? (...args) => console.error(prefix, ...args) : noop,
    info: isDev ? (...args) => console.info(prefix, ...args) : noop,
    debug: isDev ? (...args) => console.debug(prefix, ...args) : noop,
  };
}

/**
 * Check if running in development mode
 * @returns {boolean} True if in development mode
 */
export function isDevMode() {
  return isDev;
}

/**
 * Check if running in production mode
 * @returns {boolean} True if in production mode
 */
export function isProdMode() {
  return isProd;
}

export default {
  devLog,
  devWarn,
  devError,
  devInfo,
  devDebug,
  devOnly,
  createLogger,
  isDevMode,
  isProdMode,
};
