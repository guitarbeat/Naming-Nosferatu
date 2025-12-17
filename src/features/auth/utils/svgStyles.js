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

/**
 * Get common path style with fill and optional stroke
 * @param {Object} options - Style options
 * @param {string} options.fill - Fill color
 * @param {string} options.stroke - Stroke color (optional)
 * @param {string|number} options.strokeWidth - Stroke width (optional)
 * @param {boolean} options.displayInline - Whether to display inline (default: true)
 * @returns {Object} Style object
 */
export function getPathStyle({
  fill,
  stroke = "none",
  strokeWidth = "0.264583",
  displayInline = true,
}) {
  const style = {
    fill,
    stroke,
    strokeWidth: String(strokeWidth),
    ...COMMON_STROKE_STYLE,
  };

  if (displayInline) {
    style.display = "inline";
  }

  return style;
}
