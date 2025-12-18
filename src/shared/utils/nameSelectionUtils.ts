/**
 * @module nameSelectionUtils
 * @description Utilities for handling name selection state
 */

interface NameItem {
  id: string | number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/**
 * Converts an array of selected names to a Set of IDs for O(1) lookup.
 * Handles both array of objects and existing Set.
 */
export function selectedNamesToSet(
  selectedNames: NameItem[] | Set<string | number>,
): Set<string | number> {
  if (selectedNames instanceof Set) {
    return selectedNames;
  }
  return new Set(selectedNames.map((n) => n.id));
}

/**
 * Extract name IDs from selected names value (array or Set)
 * @param selectedNamesValue - Selected names as array or Set
 * @returns Array of name IDs
 */
export function extractNameIds(
  selectedNamesValue: NameItem[] | Set<string | number>,
): (string | number)[] {
  if (Array.isArray(selectedNamesValue)) {
    return selectedNamesValue.map((n) => n.id);
  }
  return Array.from(selectedNamesValue);
}
