/**
 * @module eyeTransforms
 * @description Eye transform utilities for BongoCat animations
 */

/**
 * Generate eye transform style for CSS
 * @param {Object} eyePosition - Eye position { x, y }
 * @returns {string} Transform string
 */
export function getEyeTransform(eyePosition) {
  return `translate(${eyePosition.x}px, ${eyePosition.y}px)`;
}

/**
 * Generate pupil transform style for CSS
 * @param {Object} eyePosition - Eye position { x, y }
 * @param {number} multiplier - Multiplier for eye position (default: 0.5)
 * @returns {string} Transform string
 */
export function getPupilTransform(eyePosition, multiplier = 0.5) {
  return `translate(calc(-50% + ${eyePosition.x * multiplier}px), calc(-50% + ${eyePosition.y * multiplier}px))`;
}

/**
 * Get conditional style object based on reduceMotion
 * @param {boolean} reduceMotion - Whether to reduce motion
 * @param {Object} eyePosition - Eye position { x, y }
 * @param {Function} getTransform - Transform function
 * @returns {Object} Style object
 */
export function getConditionalEyeStyle(
  reduceMotion,
  eyePosition,
  getTransform,
) {
  return !reduceMotion
    ? {
        transform: getTransform(eyePosition),
      }
    : {};
}
