/**
 * @module classNameUtils
 * @description Utility functions for className manipulation.
 */

/**
 * Combines class names, filtering out falsy values
 * @param {...(string|boolean|null|undefined)} classes - Class names to combine
 * @returns {string} Combined class names
 * @example
 * cn('base', isActive && 'active', isDisabled && 'disabled')
 * // Returns 'base active' if isActive is true and isDisabled is false
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
// - conditionalClasses
