/**
 * @module BongoCat/utils/styles
 * @description Consolidated style utilities for BongoCat animations
 * Includes conditional transforms and eye transform functions
 */

// ============================================================================
// Conditional Style Utilities
// ============================================================================

/**
 * Get conditional transform style
 * @param {boolean} reduceMotion - Whether to reduce motion
 * @param {string} transform - Transform string
 * @returns {Object} Style object
 */
export function getConditionalTransform(
	reduceMotion: boolean,
	transform: string,
) {
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
	reduceMotion: boolean,
	value: number,
	getTransform: (value: number) => string,
) {
	return !reduceMotion && value !== 0 ? { transform: getTransform(value) } : {};
}

// ============================================================================
// Eye Transform Utilities
// ============================================================================

interface EyePosition {
	x: number;
	y: number;
}

/**
 * Generate eye transform style for CSS
 * @param {Object} eyePosition - Eye position { x, y }
 * @returns {string} Transform string
 */
export function getEyeTransform(eyePosition: EyePosition): string {
	return `translate(${eyePosition.x}px, ${eyePosition.y}px)`;
}

/**
 * Generate pupil transform style for CSS
 * @param {Object} eyePosition - Eye position { x, y }
 * @param {number} multiplier - Multiplier for eye position (default: 0.5)
 * @returns {string} Transform string
 */
export function getPupilTransform(
	eyePosition: EyePosition,
	multiplier = 0.5,
): string {
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
	reduceMotion: boolean,
	eyePosition: EyePosition,
	getTransform: (position: EyePosition) => string,
) {
	return !reduceMotion
		? {
				transform: getTransform(eyePosition),
			}
		: {};
}
