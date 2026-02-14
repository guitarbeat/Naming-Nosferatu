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
import type { NameItem, RatingData, RatingItem } from "../types/appTypes";
import { CAT_IMAGES, STORAGE_KEYS } from "./constants";
import { generateCSV } from "./csvHelpers";

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface FilterOptions {
	visibility?: "visible" | "hidden" | "all";
	isAdmin?: boolean;
}

/** Minimal interface for query-cache consumers (e.g. TanStack Query). */
interface QueryClientLike {
	removeQueries: (opts: { queryKey: string[] }) => void;
	clear: () => void;
}

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
export function shuffleArray<T>(array: readonly T[]): T[] {
	const result = [...array];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		const temp = result[i];
		if (temp !== undefined && result[j] !== undefined) {
			result[i] = result[j];
			result[j] = temp;
		}
	}
	return result;
}

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
export function formatDate(
	date: Date | string | number,
	options?: Intl.DateTimeFormatOptions,
	locale?: string,
): string {
	const d = date instanceof Date ? date : new Date(date);
	if (Number.isNaN(d.getTime())) {
		return "Invalid Date";
	}
	return d.toLocaleDateString(locale, {
		year: "numeric",
		month: "short",
		day: "numeric",
		...options,
	});
}

// ═══════════════════════════════════════════════════════════════════════════════
// Display Utilities
// ═══════════════════════════════════════════════════════════════════════════════

/** English ordinal suffix for a number (1st, 2nd, 3rd, 4th, 11th, 21st…). */
function ordinalSuffix(n: number): string {
	const mod100 = n % 100;
	if (mod100 >= 11 && mod100 <= 13) {
		return "th";
	}
	switch (n % 10) {
		case 1:
			return "st";
		case 2:
			return "nd";
		case 3:
			return "rd";
		default:
			return "th";
	}
}

/**
 * Rank with medal emoji and correct ordinal suffix.
 *
 * @example
 * getRankDisplay(1)  // "🥇 1st"
 * getRankDisplay(21) // "21st"
 */
export function getRankDisplay(rank: number): string {
	const suffix = ordinalSuffix(rank);
	if (rank === 1) {
		return `🥇 1${suffix}`;
	}
	if (rank === 2) {
		return `🥈 2${suffix}`;
	}
	if (rank === 3) {
		return `🥉 3${suffix}`;
	}
	if (rank <= 10) {
		return `🏅 ${rank}${suffix}`;
	}
	return `${rank}${suffix}`;
}

const METRIC_LABELS: Record<string, string> = {
	rating: "Rating",
	total_wins: "Wins",
	selected: "Selected",
	avg_rating: "Avg Rating",
	wins: "Wins",
	dateSubmitted: "Date Added",
	losses: "Losses",
};

/** Human-readable label for a metric key. Falls back to the key itself. */
export function getMetricLabel(metricKey: string): string {
	return METRIC_LABELS[metricKey] ?? metricKey;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Logging
// ═══════════════════════════════════════════════════════════════════════════════

const isDev = import.meta.env?.DEV ?? false;

const noop = (): void => {
	/* Intentional no-op for production builds */
};

/** Console helpers that compile to no-ops in production. */
export const devLog: (...args: unknown[]) => void = isDev
	? (...args) => console.log("[DEV]", ...args)
	: noop;

export const devWarn: (...args: unknown[]) => void = isDev
	? (...args) => console.warn("[DEV]", ...args)
	: noop;

export const devError: (...args: unknown[]) => void = isDev
	? (...args) => console.error("[DEV]", ...args)
	: noop;

// ═══════════════════════════════════════════════════════════════════════════════
// Name / Filter Utilities
// ═══════════════════════════════════════════════════════════════════════════════

/** Check whether a name entry is marked as hidden (handles both casing conventions). */
export function isNameHidden(name: NameItem | null | undefined): boolean {
	return name?.is_hidden === true || name?.isHidden === true;
}

/** Shorthand: return only visible (non-hidden) names. */
export function getVisibleNames(names: NameItem[] | null | undefined): NameItem[] {
	if (!Array.isArray(names)) {
		return [];
	}
	return names.filter((n) => !isNameHidden(n));
}

/**
 * Filter names by visibility. Non-admin users always see only visible names.
 *
 * @example
 * applyNameFilters(names, { visibility: "hidden", isAdmin: true })
 */
export function applyNameFilters(
	names: NameItem[] | null | undefined,
	filters: FilterOptions = {},
): NameItem[] {
	if (!Array.isArray(names)) {
		return [];
	}

	const { visibility = "visible", isAdmin = false } = filters;

	// Non-admins never see hidden names regardless of the filter.
	if (!isAdmin) {
		return names.filter((n) => !isNameHidden(n));
	}

	switch (visibility) {
		case "hidden":
			return names.filter((n) => isNameHidden(n));
		case "all":
			return [...names];
		default:
			return names.filter((n) => !isNameHidden(n));
	}
}

/** Map a raw filter string to a typed visibility value. */
export function mapFilterStatusToVisibility(status: string): "hidden" | "all" | "visible" {
	if (status === "hidden") {
		return "hidden";
	}
	if (status === "all") {
		return "all";
	}
	return "visible";
}

/**
 * Convert selected names to a `Set` of IDs for O(1) lookup.
 * Accepts either an array of `NameItem` or an existing `Set`.
 */
export function selectedNamesToSet(
	selected: NameItem[] | Set<string | number>,
): Set<string | number> {
	if (selected instanceof Set) {
		return selected;
	}
	return new Set(selected.map((n) => n.id));
}

// ═══════════════════════════════════════════════════════════════════════════════
// Rating / Metrics Utilities
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Percentile rank of `value` within `allValues`.
 *
 * @param higherIsBetter - When `true` (default), higher values yield higher percentiles.
 */
export function calculatePercentile(
	value: number,
	allValues: number[],
	higherIsBetter = true,
): number {
	const valid = allValues.filter((v) => v != null && !Number.isNaN(v));
	if (valid.length === 0) {
		return 50;
	}

	const sorted = [...valid].sort((a, b) => a - b);
	const count = higherIsBetter
		? sorted.filter((v) => v < value).length
		: sorted.filter((v) => v > value).length;

	return Math.round((count / sorted.length) * 100);
}

/** Normalize a ratings record into an array. Already-array input is returned as-is. */
export function ratingsToArray(
	ratings:
		| Record<string, { rating: number; wins?: number; losses?: number } | number>
		| RatingItem[],
): RatingItem[] {
	if (Array.isArray(ratings)) {
		return ratings;
	}

	return Object.entries(ratings).map(([name, data]) => ({
		name,
		rating: typeof data === "number" ? data : (data?.rating ?? 1500),
		wins: typeof data === "object" ? (data?.wins ?? 0) : 0,
		losses: typeof data === "object" ? (data?.losses ?? 0) : 0,
	}));
}

/** Normalize a ratings array into a keyed record. */
export function ratingsToObject(items: RatingItem[]): Record<string, RatingData> {
	if (!Array.isArray(items)) {
		return {};
	}

	const out: Record<string, RatingData> = {};
	for (const item of items) {
		out[item.name] = {
			rating: item.rating ?? 1500,
			wins: item.wins ?? 0,
			losses: item.losses ?? 0,
		};
	}
	return out;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Cat Image Utilities
// ═══════════════════════════════════════════════════════════════════════════════

const FALLBACK_CAT_AVATARS = [
	"https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=150&h=150&fit=crop&crop=face",
	"https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?w=150&h=150&fit=crop&crop=face",
	"https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=150&h=150&fit=crop&crop=face",
	"https://images.unsplash.com/photo-1574158622682-e40e69881006?w=150&h=150&fit=crop&crop=face",
	"https://images.unsplash.com/photo-1519052537078-e6302a4968d4?w=150&h=150&fit=crop&crop=face",
	"https://images.unsplash.com/photo-1511044568932-338cba0ad803?w=150&h=150&fit=crop&crop=face",
] as const;

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
export async function fetchCatAvatars(count = 6): Promise<string[]> {
	try {
		const res = await fetch(`https://api.thecatapi.com/v1/images/search?limit=${count}&size=thumb`);
		if (!res.ok) {
			throw new Error(`HTTP ${res.status}`);
		}
		const data: { url: string }[] = await res.json();
		return data.map((d) => d.url);
	} catch {
		return [...FALLBACK_CAT_AVATARS].slice(0, count);
	}
}

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
	const csv = generateCSV(rankings);
	if (!csv) {
		return;
	}

	const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
	const name = filename ?? `cat_names_${new Date().toISOString().slice(0, 10)}.csv`;
	downloadBlob(blob, name);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Cache Utilities
// ═══════════════════════════════════════════════════════════════════════════════

/** Remove tournament-related entries from the query cache. */
export function clearTournamentCache(queryClient: QueryClientLike): boolean {
	try {
		queryClient.removeQueries({ queryKey: ["tournament"] });
		queryClient.removeQueries({ queryKey: ["catNames"] });
		return true;
	} catch (error) {
		console.error("Error clearing tournament cache:", error);
		return false;
	}
}

/** Clear the entire query cache and tournament localStorage entry. */
export function clearAllCaches(queryClient: QueryClientLike): boolean {
	try {
		queryClient.clear();
		localStorage.removeItem(STORAGE_KEYS.TOURNAMENT);
		return true;
	} catch (error) {
		console.error("Error clearing all caches:", error);
		return false;
	}
}

// ═══════════════════════════════════════════════════════════════════════════════
// Image Compression
// ═══════════════════════════════════════════════════════════════════════════════

/** Load a `File` into an `HTMLImageElement` (browser only). */
function loadImage(file: File): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const url = URL.createObjectURL(file);
		const img = new Image();
		img.onload = () => {
			URL.revokeObjectURL(url);
			resolve(img);
		};
		img.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error("Failed to load image"));
		};
		img.src = url;
	});
}

/**
 * Compress and convert an image file to WebP.
 *
 * Returns the original file unchanged if compression fails or would produce
 * a larger file, or if running outside a browser context.
 *
 * @param file    - Source image file
 * @param options - Max dimensions and quality (0.1 – 0.95)
 */
export async function compressImageFile(
	file: File,
	options: { maxWidth?: number; maxHeight?: number; quality?: number } = {},
): Promise<File> {
	if (typeof document === "undefined") {
		return file;
	}

	const { maxWidth = 1600, maxHeight = 1600, quality = 0.8 } = options;

	try {
		const img = await loadImage(file);
		const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
		const w = Math.round(img.width * scale);
		const h = Math.round(img.height * scale);

		const canvas = document.createElement("canvas");
		canvas.width = w;
		canvas.height = h;

		const ctx = canvas.getContext("2d", { alpha: true });
		if (!ctx) {
			return file;
		}
		ctx.drawImage(img, 0, 0, w, h);

		const clampedQuality = Math.min(Math.max(quality, 0.1), 0.95);
		const blob = await new Promise<Blob | null>((resolve) =>
			canvas.toBlob(resolve, "image/webp", clampedQuality),
		);
		if (!blob) {
			return file;
		}

		const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
		return new File([blob], `${baseName}.webp`, { type: "image/webp" });
	} catch {
		return file;
	}
}

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
class SoundManager {
	private cache = new Map<string, HTMLAudioElement>();
	private volume = 0.3;
	private _enabled = true;

	get enabled(): boolean {
		return this._enabled;
	}

	set enabled(value: boolean) {
		this._enabled = value;
	}

	/** Pre-load an audio file for instant playback later. */
	register(name: string, src: string): void {
		if (typeof Audio === "undefined") {
			return;
		}
		const audio = new Audio(src);
		audio.preload = "auto";
		this.cache.set(name, audio);
	}

	/** Play a registered sound. Silently ignores autoplay restrictions. */
	play(name: string, config: { volume?: number } = {}): void {
		if (!this._enabled) {
			return;
		}
		const source = this.cache.get(name);
		if (!source) {
			return;
		}

		const instance = source.cloneNode() as HTMLAudioElement;
		instance.volume = config.volume ?? this.volume;
		instance.currentTime = 0;
		instance.play().catch(() => {
			/* blocked by browser autoplay policy — ignore */
		});
	}

	setVolume(volume: number): void {
		this.volume = Math.max(0, Math.min(1, volume));
	}
}

export const soundManager = new SoundManager();

/** Convenience wrapper for `soundManager.play()`. */
export function playSound(name: string, config?: { volume?: number }): void {
	soundManager.play(name, config);
}
