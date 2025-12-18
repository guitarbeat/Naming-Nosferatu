/**
 * @module nameSelectionUtils
 * @description Utilities for handling name selection state
 */

interface NameItem {
  id: string;
  [key: string]: unknown;
}

/**
 * Convert selected names array to a Set of IDs
 * @param selectedNames - Array of selected name objects
 * @returns Set of selected name IDs
 */
export function selectedNamesToSet(selectedNames: NameItem[]): Set<string> {
  return new Set(selectedNames.map((n) => n.id));
}

/**
 * Extract name IDs from selected names value (array or Set)
 * @param selectedNamesValue - Selected names as array or Set
 * @returns Array of name IDs
 */
export function extractNameIds(
  selectedNamesValue: NameItem[] | Set<string>
): string[] {
  if (Array.isArray(selectedNamesValue)) {
    return selectedNamesValue.map((n) => n.id);
  }
  return Array.from(selectedNamesValue);
}
