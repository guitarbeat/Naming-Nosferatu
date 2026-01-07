// Re-exports
export * from "./auth";
export * from "./export";
export * from "./metrics";
export * from "./name";
export * from "./performance";
export * from "./tournament";
export * from "./ui";
export * from "./validation";

// Imports for consolidated utils
import { STORAGE_KEYS } from "../../../core/constants";
import type { NameItem } from "../../../types/components";
import { queryClient } from "../../services/supabase/queryClient";

// --- logger.ts ---
const isDev = import.meta.env?.DEV || process.env.NODE_ENV === "development";

export const noop = (..._args: unknown[]) => {
	// Intentional no-op function
};

export const devLog = isDev ? (...args: unknown[]) => console.log("[DEV]", ...args) : noop;
export const devWarn = isDev ? (...args: unknown[]) => console.warn("[DEV]", ...args) : noop;
export const devError = isDev ? (...args: unknown[]) => console.error("[DEV]", ...args) : noop;

// --- time.ts ---
export function formatDate(date: Date | string | number, options: Intl.DateTimeFormatOptions = {}) {
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

// --- cache.ts ---
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

// --- array.ts ---
// * Shuffles an array using the Fisher-Yates algorithm
export function shuffleArray<T>(array: T[]): T[] {
	const newArray = [...array];
	for (let i = newArray.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[newArray[i]!, newArray[j]!] = [newArray[j]!, newArray[i]!];
	}
	return newArray;
}

// * Generate all possible pairs from a list of names
export function generatePairs(nameList: NameItem[]): [NameItem, NameItem][] {
	const pairs: [NameItem, NameItem][] = [];
	for (let i = 0; i < nameList.length; i++) {
		for (let j = i + 1; j < nameList.length; j++) {
			pairs.push([nameList[i]!, nameList[j]!]);
		}
	}
	return pairs;
}

export interface ComparisonHistory {
	winner: string;
	loser: string;
}

// * Build a comparisons map from tournament history
export function buildComparisonsMap(history: ComparisonHistory[]): Map<string, number> {
	const comparisons = new Map<string, number>();

	for (const { winner, loser } of history) {
		const pair = [winner, loser].sort().join(":");
		comparisons.set(pair, (comparisons.get(pair) || 0) + 1);
	}

	return comparisons;
}
