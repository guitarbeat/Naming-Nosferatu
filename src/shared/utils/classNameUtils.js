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

/**
 * Combines class names from a styles object with conditional classes
 * @param {Object} styles - CSS module styles object
 * @param {string} baseClass - Base class name from styles
 * @param {Object} conditionals - Object mapping class names to boolean conditions
 * @param {string} extraClasses - Additional class names to append
 * @returns {string} Combined class names
 * @example
 * cnStyles(styles, 'button', { active: isActive, disabled: isDisabled }, className)
 */
export function cnStyles(
  styles,
  baseClass,
  conditionals = {},
  extraClasses = "",
) {
  const classes = [styles[baseClass]];

  Object.entries(conditionals).forEach(([className, condition]) => {
    if (condition && styles[className]) {
      classes.push(styles[className]);
    }
  });

  if (extraClasses) {
    classes.push(extraClasses);
  }

  return classes.filter(Boolean).join(" ");
}

/**
 * Creates a conditional class string from styles
 * @param {Object} styles - CSS module styles object
 * @param {boolean} condition - Condition to check
 * @param {string} trueClass - Class to use when condition is true
 * @param {string} falseClass - Class to use when condition is false (default: "")
 * @returns {string} The appropriate class name
 * @example
 * conditionalClass(styles, isActive, 'active', 'inactive')
 */
export function conditionalClass(
  styles,
  condition,
  trueClass,
  falseClass = "",
) {
  if (condition) {
    return styles[trueClass] || "";
  }
  return falseClass ? styles[falseClass] || "" : "";
}

/**
 * Combines multiple conditional style classes
 * @param {Object} styles - CSS module styles object
 * @param {Array<[boolean, string]>} conditions - Array of [condition, className] pairs
 * @returns {string} Combined class names
 * @example
 * conditionalClasses(styles, [
 *   [isActive, 'active'],
 *   [isDisabled, 'disabled'],
 *   [isLoading, 'loading']
 * ])
 */
export function conditionalClasses(styles, conditions) {
  return conditions
    .filter(([condition]) => condition)
    .map(([, className]) => styles[className] || "")
    .filter(Boolean)
    .join(" ");
}

export default {
  cn,
  cnStyles,
  conditionalClass,
  conditionalClasses,
};
