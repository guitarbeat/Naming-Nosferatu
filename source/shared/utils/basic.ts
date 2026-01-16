/**
 * @file basic.ts
 * @description Consolidated basic utility functions for common tasks
 * Combines: array manipulation, caching, date formatting, and logging
 */

import { STORAGE_KEYS } from "../../core/constants";
import type { NameItem } from "../../types/components";
import { queryClient } from "../services/supabase/queryClient";

/* ==========================================================================
   ARRAY UTILITIES
   ========================================================================== */

/**
 * Shuffles an array using the Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // biome-ignore lint/style/noNonNullAssertion: Array indices are guaranteed valid within loop bounds
    const temp = newArray[i]!;
    // biome-ignore lint/style/noNonNullAssertion: Array indices are guaranteed valid within loop bounds
    newArray[i] = newArray[j]!;
    newArray[j] = temp;
  }
  return newArray;
}

/**
 * Generate all possible pairs from a list of names
 */
export function generatePairs(nameList: NameItem[]): [NameItem, NameItem][] {
  const pairs: [NameItem, NameItem][] = [];
  for (let i = 0; i < nameList.length; i++) {
    for (let j = i + 1; j < nameList.length; j++) {
      const nameA = nameList[i];
      const nameB = nameList[j];
      if (nameA && nameB) {
        pairs.push([nameA, nameB]);
      }
    }
  }
  return pairs;
}

/* ==========================================================================
   CACHE UTILITIES
   ========================================================================== */

/**
 * Clear tournament-related query cache
 */
export function clearTournamentCache() {
  try {
    queryClient.removeQueries({ queryKey: ["tournament"] });
    queryClient.removeQueries({ queryKey: ["catNames"] });
    return true;
  } catch (error) {
    console.error("Error clearing tournament cache:", error);
    return false;
  }
}

/**
 * Clear all caches including local storage
 */
export function clearAllCaches() {
  try {
    queryClient.clear();
    localStorage.removeItem(STORAGE_KEYS.TOURNAMENT);
    return true;
  } catch (error) {
    console.error("Error clearing all caches:", error);
    return false;
  }
}

/* ==========================================================================
   DATE UTILITIES
   ========================================================================== */

/**
 * Format a date with localization support
 */
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {},
) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) {
    return "Invalid Date";
  }
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  });
}

/* ==========================================================================
   LOGGING UTILITIES
   ========================================================================== */

const isDev = import.meta.env?.DEV || process.env.NODE_ENV === "development";

/**
 * No-op function for conditional logging
 */
export const noop = (..._args: unknown[]) => {
  // Intentional no-op function
};

/**
 * Development-only logging utilities
 * Only log when NODE_ENV is "development"
 */
export const devLog = isDev
  ? (...args: unknown[]) => console.log("[DEV]", ...args)
  : noop;
export const devWarn = isDev
  ? (...args: unknown[]) => console.warn("[DEV]", ...args)
  : noop;
export const devError = isDev
  ? (...args: unknown[]) => console.error("[DEV]", ...args)
  : noop;
