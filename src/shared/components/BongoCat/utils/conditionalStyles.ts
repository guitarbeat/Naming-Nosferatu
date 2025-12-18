/**
 * @module conditionalStyles
 * @description Utilities for conditional style generation based on reduceMotion
 */

/**
 * Get conditional transform style
 * @param {boolean} reduceMotion - Whether to reduce motion
 * @param {string} transform - Transform string
 * @returns {Object} Style object
 */
export function getConditionalTransform(reduceMotion, transform) {
  return !reduceMotion ? { transform } : {};
}

/**
 * Get conditional transform with value check
 * @param {boolean} reduceMotion - Whether to reduce motion
 * @param {number} value - Value to check (e.g., headTilt)
 * @param {Function} getTransform - Function that takes value and returns transform string
 * @returns {Object} Style object
 */
export function getConditionalTransformWithValue(
  reduceMotion,
  value,
  getTransform,
) {
  return !reduceMotion && value !== 0 ? { transform: getTransform(value) } : {};
}
