/**
 * @module cache
 * @description Cache management utilities
 */

import { queryClient } from "../services/supabase/client";
import { STORAGE_KEYS } from "./constants";

/**
 * Clear tournament-related query cache
 */
export function clearTournamentCache(): boolean {
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
export function clearAllCaches(): boolean {
	try {
		queryClient.clear();
		localStorage.removeItem(STORAGE_KEYS.TOURNAMENT);
		return true;
	} catch (error) {
		console.error("Error clearing all caches:", error);
		return false;
	}
}
