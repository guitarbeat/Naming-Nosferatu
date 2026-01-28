/**
 * @file basic.ts
 * @description Consolidated basic utility functions for common tasks
 * Combines: array manipulation, caching, date formatting, and logging
 */

import type { NameItem } from "@/types";
import { STORAGE_KEYS } from "../constants";
import { queryClient } from "../services/supabase/client";

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
		const swapTemp = newArray[i]!;
		// biome-ignore lint/style/noNonNullAssertion: Array indices are guaranteed valid within loop bounds
		newArray[i] = newArray[j]!;
		newArray[j] = swapTemp;
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

/**
 * Get a time-based greeting string
 * @returns "Good morning", "Good afternoon", or "Good evening"
 */
export function getGreeting(): string {
	const hour = new Date().getHours();
	if (hour < 12) {
		return "Good morning";
	}
	if (hour < 18) {
		return "Good afternoon";
	}
	return "Good evening";
}

/* ==========================================================================
   LOGGING UTILITIES
   ========================================================================== */

const isDev = import.meta.env?.DEV || process.env.NODE_ENV === "development";

/**
 * No-op function for conditional logging
 */
const noop = (..._args: unknown[]) => {
	// Intentional no-op function
};

/**
 * Development-only logging utilities
 * Only log when NODE_ENV is "development"
 */
export const devLog = isDev ? (...args: unknown[]) => console.log("[DEV]", ...args) : noop;
export const devWarn = isDev ? (...args: unknown[]) => console.warn("[DEV]", ...args) : noop;
export const devError = isDev ? (...args: unknown[]) => console.error("[DEV]", ...args) : noop;

/* ==========================================================================
   CSV EXPORT UTILITIES (merged from csv.ts)
   ========================================================================== */

/**
 * Exports tournament results to a CSV file.
 *
 * @param rankings Array of NameItems with rankings
 * @param filename Optional filename (default: generated based on date)
 */
export const exportTournamentResultsToCSV = (rankings: NameItem[], filename?: string): void => {
	if (!rankings.length) {
		return;
	}

	const headers = ["Name", "Rating", "Wins", "Losses"];
	const rows = rankings.map((r) =>
		[`"${r.name}"`, Math.round(Number(r.rating || 1500)), r.wins || 0, r.losses || 0].join(","),
	);

	const csvContent = [headers.join(","), ...rows].join("\n");
	const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
	const link = document.createElement("a");

	const downloadName = filename || `cat_names_${new Date().toISOString().slice(0, 10)}.csv`;

	if (link.download !== undefined) {
		const url = URL.createObjectURL(blob);
		link.setAttribute("href", url);
		link.setAttribute("download", downloadName);
		link.style.visibility = "hidden";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}
};

/* ==========================================================================
   CONCURRENCY UTILITIES
   ========================================================================== */

/**
 * Process an array of items with a concurrency limit.
 *
 * @param items Array of items to process
 * @param limit Maximum number of concurrent operations
 * @param iterator Async function to process each item
 * @returns Promise resolving to an array of results in the original order
 */
export async function asyncMapLimit<T, R>(
	items: T[],
	limit: number,
	iterator: (item: T) => Promise<R>,
): Promise<R[]> {
	if (limit < 1) {
		throw new Error("Limit must be at least 1");
	}

	const results: R[] = [];
	let index = 0;

	const next = async (): Promise<void> => {
		while (index < items.length) {
			const i = index++;
			const item = items[i];
			// biome-ignore lint/style/noNonNullAssertion: index check guarantees item existence
			results[i] = await iterator(item!);
		}
	};

	const threads: Promise<void>[] = [];
	for (let i = 0; i < limit; i++) {
		threads.push(next());
	}

	await Promise.all(threads);
	return results;
}
