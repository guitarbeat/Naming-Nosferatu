/**
 * @module svgTransforms
 * @description SVG transform utilities for cat eye animations
 */

const EYE_MATRIX = "0.98048242,-0.19660678,0.20800608,0.97812753,0,0";

/**
 * Generate eye transform string for SVG elements
 * @param {Object} eyePosition - Eye position { x, y }
 * @param {number} multiplier - Multiplier for eye position (default: 1)
 * @returns {string} Transform string
 */
export function getEyeTransform(eyePosition, multiplier = 1) {
  return `matrix(${EYE_MATRIX}) translate(${eyePosition.x * multiplier}, ${eyePosition.y * multiplier})`;
}
