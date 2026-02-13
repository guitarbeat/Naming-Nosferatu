/**
 * @module logging
 * @description Development-only logging utilities
 */

const isDev = import.meta.env?.DEV || process.env.NODE_ENV === "development";

/**
 * No-op function for conditional logging
 */
const noop = (..._args: unknown[]) => {
	// Intentional no-op function
};

/**
 * Development-only logging utilities
 * Only log when NODE_ENV is "development"
 */
export const devLog = isDev ? (...args: unknown[]) => console.log("[DEV]", ...args) : noop;
export const devWarn = isDev ? (...args: unknown[]) => console.warn("[DEV]", ...args) : noop;
export const devError = isDev ? (...args: unknown[]) => console.error("[DEV]", ...args) : noop;
