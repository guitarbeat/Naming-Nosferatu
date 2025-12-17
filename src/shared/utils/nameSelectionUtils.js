/**
 * @module nameSelectionUtils
 * @description Utilities for handling name selection data structures
 */

/**
 * Convert selectedNames to a Set of IDs
 * @param {Set|Array|Object} selectedNames - Selected names in various formats
 * @returns {Set} Set of name IDs
 */
export function selectedNamesToSet(selectedNames) {
  if (selectedNames instanceof Set) return selectedNames;
  if (Array.isArray(selectedNames)) {
    return new Set(
      selectedNames.map((item) => (typeof item === "object" ? item.id : item)),
    );
  }
  return new Set();
}

/**
 * Extract name IDs from selectedNames, handling different formats
 * @param {Set|Array|Object} selectedNamesValue - Selected names in various formats
 * @returns {Array} Array of name IDs
 */
export function extractNameIds(selectedNamesValue) {
  if (!selectedNamesValue) return [];

  // * If it's a Set (profile mode), convert to array of IDs
  if (selectedNamesValue instanceof Set) {
    return Array.from(selectedNamesValue).filter((id) => id != null);
  }

  // * If it's an array, extract IDs properly
  if (Array.isArray(selectedNamesValue)) {
    return selectedNamesValue
      .map((name) => {
        // * If it's an object with an id property, extract it
        if (typeof name === "object" && name !== null && name.id) {
          return name.id;
        }
        // * If it's already a string (ID), use it directly
        if (typeof name === "string") {
          return name;
        }
        // * Otherwise, return null to filter out
        return null;
      })
      .filter((id) => id != null); // * Filter out null/undefined values
  }

  return [];
}
