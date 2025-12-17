/**
 * @module svgStyles
 * @description Common SVG style objects to reduce duplication
 */

/**
 * Common stroke style properties used throughout the cat SVG
 */
export const COMMON_STROKE_STYLE = {
  strokeLinecap: "round",
  strokeLinejoin: "round",
  strokeDasharray: "none",
  strokeOpacity: "0.988235",
};

/**
 * Get stroke style with custom stroke width
 * @param {string|number} strokeWidth - Stroke width value
 * @returns {Object} Stroke style object
 */
export function getStrokeStyle(strokeWidth) {
  return {
    ...COMMON_STROKE_STYLE,
    strokeWidth: String(strokeWidth),
  };
}
