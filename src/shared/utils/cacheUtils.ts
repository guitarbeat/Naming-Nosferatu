/**
 * @module cacheUtils
 * @description Utility functions for clearing application caches
 */

import { queryClient } from "../services/supabase/queryClient";

/**
 * Clear all tournament-related localStorage entries
 */
export function clearTournamentCache() {
  if (typeof window === "undefined") return;

  try {
    const keysToRemove = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith("tournament-")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => window.localStorage.removeItem(key));

    if (process.env.NODE_ENV === "development") {
      console.log(`🧹 Cleared ${keysToRemove.length} tournament cache entries`);
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error clearing tournament cache:", error);
    }
  }
}

/**
 * Clear React Query cache for name-related queries
 */
function clearNameDataCache() {
  try {
    // Clear all queries related to names
    queryClient.invalidateQueries({ queryKey: ["names"] });
    queryClient.invalidateQueries({ queryKey: ["catNames"] });
    queryClient.invalidateQueries({ queryKey: ["hiddenNames"] });
    queryClient.invalidateQueries({ queryKey: ["userRatings"] });

    // Remove cached queries
    queryClient.removeQueries({ queryKey: ["names"] });
    queryClient.removeQueries({ queryKey: ["catNames"] });
    queryClient.removeQueries({ queryKey: ["hiddenNames"] });
    queryClient.removeQueries({ queryKey: ["userRatings"] });

    if (process.env.NODE_ENV === "development") {
      console.log("🧹 Cleared React Query name data cache");
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error clearing React Query cache:", error);
    }
  }
}

/**
 * Clear all application caches (tournament + React Query)
 */
export function clearAllCaches() {
  clearTournamentCache();
  clearNameDataCache();
}
