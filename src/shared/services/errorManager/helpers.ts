/**
 * @module errorManager/helpers
 * @description Helper functions for error management.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GLOBAL_SCOPE: any =
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : {};

/**
 * * Deep freeze an object to prevent mutations
 * @param {Object} object - Object to freeze
 * @returns {Object} Frozen object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const deepFreeze = (object: any) => {
  if (object && typeof object === "object" && !Object.isFrozen(object)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Object.values(object).forEach((value: any) => {
      if (typeof value === "object" && value !== null) {
        deepFreeze(value);
      }
    });
    Object.freeze(object);
  }
  return object;
};

/**
 * * Create a hash from a value
 * @param {*} value - Value to hash
 * @returns {string} Hash string
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createHash = (value: any) => {
  const stringValue = typeof value === "string" ? value : JSON.stringify(value);
  let hash = 0;
  if (!stringValue) {
    return "hash_0";
  }

  for (let index = 0; index < stringValue.length; index += 1) {
    hash = (hash << 5) - hash + stringValue.charCodeAt(index);
    hash |= 0; // Convert to 32bit integer
  }

  return `hash_${Math.abs(hash)}`;
};

/**
 * * Get the global scope object
 * @returns {Object} Global scope object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getGlobalScope = (): any => GLOBAL_SCOPE;
