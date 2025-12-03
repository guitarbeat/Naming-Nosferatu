/**
 * @module logger
 * @description Logging utilities for development and debugging.
 */

const isDev = process.env.NODE_ENV === "development";
const isProd = process.env.NODE_ENV === "production";

/**
 * * Log messages during development only
 * @param {...any} args - Arguments to log
 */
export function devLog(...args) {
  if (isDev) {
    // * Log with [DEV] prefix - browser console will handle objects properly
    // * Objects are passed as-is so they can be inspected in console
    console.log("[DEV]", ...args);
  }
}

/**
 * * Log warning messages during development only
 * @param {...any} args - Arguments to log
 */
export function devWarn(...args) {
  if (isDev) {
    console.warn("[DEV]", ...args);
  }
}

/**
 * * Log error messages during development only
 * @param {...any} args - Arguments to log
 */
export function devError(...args) {
  if (isDev) {
    console.error("[DEV]", ...args);
  }
}

/**
 * * Log info messages during development only
 * @param {...any} args - Arguments to log
 */
export function devInfo(...args) {
  if (isDev) {
    console.info("[DEV]", ...args);
  }
}

/**
 * * Log debug messages during development only
 * @param {...any} args - Arguments to log
 */
export function devDebug(...args) {
  if (isDev) {
    console.debug("[DEV]", ...args);
  }
}

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
    log: (...args) => isDev && console.log(prefix, ...args),
    warn: (...args) => isDev && console.warn(prefix, ...args),
    error: (...args) => isDev && console.error(prefix, ...args),
    info: (...args) => isDev && console.info(prefix, ...args),
    debug: (...args) => isDev && console.debug(prefix, ...args),
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
