/**
 * @module basic
 * @description Consolidated utility functions: arrays, dates, logging, display,
 * names/filtering, ratings, cat images, CSV export, caching, image compression,
 * haptics, sound, and className merging.
 *
 * All types that were previously imported from external modules are defined
 * inline so this file has zero project-specific import dependencies beyond
 * its sibling `./constants`.
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { NameItem } from "@/shared/types";
import { CAT_IMAGES } from "./constants";

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

/** Minimal interface for query-cache consumers (e.g. TanStack Query). */

// ═══════════════════════════════════════════════════════════════════════════════
// Class Names
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Merge class names with Tailwind-aware conflict resolution.
 *
 * @example
 * cn("px-4 py-2", isActive && "bg-blue-500", className)
 * cn("text-red-500", "text-blue-500") // → "text-blue-500"
 */
export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}

// ═══════════════════════════════════════════════════════════════════════════════
// Array Utilities
// ═══════════════════════════════════════════════════════════════════════════════

/** Fisher-Yates shuffle — returns a new array. */

// ═══════════════════════════════════════════════════════════════════════════════
// Date Utilities
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Format a date with localization support.
 *
 * @example
 * formatDate("2024-01-15")             // "Jan 15, 2024"
 * formatDate(Date.now(), { month: "long" }) // "January 15, 2024"
 */

// ═══════════════════════════════════════════════════════════════════════════════
// Display Utilities
// ═══════════════════════════════════════════════════════════════════════════════

/** English ordinal suffix for a number (1st, 2nd, 3rd, 4th, 11th, 21st…). */

/**
 * Rank with medal emoji and correct ordinal suffix.
 *
 * @example
 * getRankDisplay(1)  // "🥇 1st"
 * getRankDisplay(21) // "21st"
 */

// ═══════════════════════════════════════════════════════════════════════════════
// Logging
// ═══════════════════════════════════════════════════════════════════════════════





// ═══════════════════════════════════════════════════════════════════════════════
// Name / Filter Utilities
// ═══════════════════════════════════════════════════════════════════════════════

/** Check whether a name entry is marked as hidden (handles both casing conventions). */
function isNameHidden(name: NameItem | null | undefined): boolean {
	return name?.is_hidden === true || name?.isHidden === true;
}

/** Shorthand: return only visible (non-hidden) names. */
export function getVisibleNames(names: NameItem[] | null | undefined): NameItem[] {
	if (!Array.isArray(names)) {
		return [];
	}
	return names.filter((n) => !isNameHidden(n));
}



// ═══════════════════════════════════════════════════════════════════════════════
// Rating / Metrics Utilities
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Percentile rank of `value` within `allValues`.
 *
 * @param higherIsBetter - When `true` (default), higher values yield higher percentiles.
 */

/** Normalize a ratings record into an array. Already-array input is returned as-is. */

// ═══════════════════════════════════════════════════════════════════════════════
// Cat Image Utilities
// ═══════════════════════════════════════════════════════════════════════════════

// Cache for memoization to avoid redundant hash calculations
const imageCache = new Map<string, string>();

/**
 * Robust hash function using FNV-1a algorithm for better distribution
 */
function hashString(str: string): number {
	let hash = 2166136261;
	for (let i = 0; i < str.length; i++) {
		hash ^= str.charCodeAt(i);
		hash *= 16777619;
	}
	return hash;
}

/** Deterministic image selection based on a seed id with memoization. */
export function getRandomCatImage(
	id: string | number | null | undefined,
	images: readonly string[] = CAT_IMAGES,
): string {
	if (!id || images.length === 0) {
		return images[0] ?? "";
	}

	const cacheKey = `${id}-${images.length}`;

	// Check cache first
	if (imageCache.has(cacheKey)) {
		const cached = imageCache.get(cacheKey);
		return cached || images[0] || "";
	}

	const seed = typeof id === "string" ? hashString(id) : Number(id);
	const index = Math.abs(seed) % images.length;
	const selectedImage = images[index] ?? images[0] ?? "";

	// Cache the result
	imageCache.set(cacheKey, selectedImage);

	return selectedImage;
}

/**
 * Fetch random cat thumbnails from The Cat API.
 * Falls back to Unsplash URLs if the request fails.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CSV Export
// ═══════════════════════════════════════════════════════════════════════════════

/** Trigger a file download in the browser. */
function downloadBlob(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const link = Object.assign(document.createElement("a"), {
		href: url,
		download: filename,
		style: "display:none",
	});
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

/**
 * Export tournament rankings as a CSV file.
 *
 * @example
 * exportTournamentResultsToCSV(rankings, "finals-2024.csv");
 */
export function exportTournamentResultsToCSV(rankings: NameItem[], filename?: string): void {
	if (rankings.length === 0) {
		return;
	}

	const headers = ["Name", "Rating", "Wins", "Losses"];
	const rows = rankings.map((r) =>
		[
			`"${(r.name ?? "").replace(/"/g, '""')}"`, // escape embedded quotes
			Math.round(Number(r.rating ?? 1500)),
			r.wins ?? 0,
			r.losses ?? 0,
		].join(","),
	);

	const csv = [headers.join(","), ...rows].join("\n");
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
	const name = filename ?? `cat_names_${new Date().toISOString().slice(0, 10)}.csv`;
	downloadBlob(blob, name);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Cache Utilities
// ═══════════════════════════════════════════════════════════════════════════════

/** Remove tournament-related entries from the query cache. */

/** Clear the entire query cache and tournament localStorage entry. */

// ═══════════════════════════════════════════════════════════════════════════════
// Image Compression
// ═══════════════════════════════════════════════════════════════════════════════

/** Load a `File` into an `HTMLImageElement` (browser only). */

// ═══════════════════════════════════════════════════════════════════════════════
// Haptic Feedback
// ═══════════════════════════════════════════════════════════════════════════════

/** Short single-tap vibration for navigation actions. */
export function hapticNavTap(): void {
	if (typeof navigator !== "undefined") {
		navigator.vibrate?.(10);
	}
}

/** Pattern vibration for tournament start. */
export function hapticTournamentStart(): void {
	if (typeof navigator !== "undefined") {
		navigator.vibrate?.([50, 50, 50]);
	}
}

// ═══════════════════════════════════════════════════════════════════════════════
// Sound Manager
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Lightweight audio manager.
 *
 * Register sounds with `soundManager.register("click", "/sounds/click.mp3")`,
 * then play them with `playSound("click")`.
 */
