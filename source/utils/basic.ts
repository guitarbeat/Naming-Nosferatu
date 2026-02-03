/**
 * @file basic.ts
 * @description Consolidated basic utility functions for common tasks
 * Combines: array manipulation, caching, date formatting, and logging
 */

import type { NameItem } from "@/types/appTypes";
import { queryClient } from "../services/supabase/client";
import { CAT_IMAGES, STORAGE_KEYS } from "./constants";

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
   CAT IMAGE UTILITIES
   ========================================================================== */

interface CatImage {
	id: string;
	url: string;
	width: number;
	height: number;
}

/**
 * Fallback cat avatar URLs when API fails
 */
const FALLBACK_CAT_AVATARS = [
	"https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=150&h=150&fit=crop&crop=face",
	"https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?w=150&h=150&fit=crop&crop=face",
	"https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=150&h=150&fit=crop&crop=face",
	"https://images.unsplash.com/photo-1574158622682-e40e69881006?w=150&h=150&fit=crop&crop=face",
	"https://images.unsplash.com/photo-1519052537078-e6302a4968d4?w=150&h=150&fit=crop&crop=face",
	"https://images.unsplash.com/photo-1511044568932-338cba0ad803?w=150&h=150&fit=crop&crop=face",
];

/**
 * Fetch multiple random cat images from The Cat API
 */
export const fetchCatAvatars = async (count: number = 6): Promise<string[]> => {
	try {
		const response = await fetch(
			`https://api.thecatapi.com/v1/images/search?limit=${count}&size=thumb`,
		);
		if (!response.ok) {
			throw new Error("Failed to fetch cat images");
		}
		const cats = await response.json();
		return cats.map((cat: CatImage) => cat.url);
	} catch {
		return FALLBACK_CAT_AVATARS;
	}
};

/**
 * Get a deterministic random cat image based on ID
 */
export function getRandomCatImage(id: string | number | null | undefined, images = CAT_IMAGES) {
	if (!id) {
		return images[0];
	}
	const seed =
		typeof id === "string"
			? id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
			: Number(id);
	return images[Math.abs(seed) % images.length];
}

/* ==========================================================================
   NAME SET UTILITIES
   ========================================================================== */

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

/* ==========================================================================
   NAME GENERATION UTILITIES
   ========================================================================== */

/* ==========================================================================
   FILTER UTILITIES
   ========================================================================== */

export interface FilterOptions {
	visibility?: "visible" | "hidden" | "all";
	isAdmin?: boolean;
}

/**
 * Check if a name is hidden
 */
export function isNameHidden(name: NameItem | null | undefined): boolean {
	return name?.is_hidden === true || name?.isHidden === true;
}

/**
 * Get all names that are not hidden
 */
export function getVisibleNames(names: NameItem[] | null | undefined): NameItem[] {
	if (!Array.isArray(names)) {
		return [];
	}
	return names.filter((n) => !isNameHidden(n));
}

/**
 * Map filterStatus to visibility string
 */
export function mapFilterStatusToVisibility(filterStatus: string): "hidden" | "all" | "visible" {
	if (filterStatus === "hidden") {
		return "hidden";
	}
	if (filterStatus === "all") {
		return "all";
	}
	return "visible";
}

/**
 * Internal visibility filter
 */
function filterByVisibility(
	names: NameItem[] | null | undefined,
	{
		visibility = "visible",
		isAdmin = false,
	}: { visibility?: "visible" | "hidden" | "all"; isAdmin?: boolean } = {},
): NameItem[] {
	if (!Array.isArray(names)) {
		return [];
	}
	if (!isAdmin) {
		return names.filter((n) => !isNameHidden(n));
	}

	switch (visibility) {
		case "hidden":
			return names.filter((n) => isNameHidden(n));
		case "all":
			return names;
		default:
			return names.filter((n) => !isNameHidden(n));
	}
}

/**
 * Apply visibility filter to names
 */
export function applyNameFilters(
	names: NameItem[] | null | undefined,
	filters: FilterOptions = {},
): NameItem[] {
	const { visibility = "visible", isAdmin = false } = filters;

	if (!names || !Array.isArray(names)) {
		return [];
	}
	return filterByVisibility([...names], { visibility, isAdmin });
}

import { cx } from "class-variance-authority";
import type { ClassValue } from "class-variance-authority/types";

/* ==========================================================================
   CLASSNAME UTILITIES
   ========================================================================== */

/**
 * Combines class names using class-variance-authority
 */
export function cn(...inputs: ClassValue[]) {
	return cx(inputs);
}

/* ==========================================================================
   DISPLAY UTILITIES
   ========================================================================== */

export function getRankDisplay(rank: number): string {
	if (rank === 1) {
		return "🥇 1st";
	}
	if (rank === 2) {
		return "🥈 2nd";
	}
	if (rank === 3) {
		return "🥉 3rd";
	}
	if (rank <= 10) {
		return `🏅 ${rank}th`;
	}
	return `${rank}th`;
}

/* ==========================================================================
   IMAGE UTILITIES
   ========================================================================== */

async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		if (typeof window === "undefined") {
			reject(new Error("Browser environment required"));
			return;
		}
		const url = URL.createObjectURL(file);
		const img = new Image();
		img.onload = () => {
			URL.revokeObjectURL(url);
			resolve(img);
		};
		img.onerror = (e) => {
			URL.revokeObjectURL(url);
			reject(e);
		};
		img.src = url;
	});
}

export async function compressImageFile(
	file: File,
	{
		maxWidth = 1600,
		maxHeight = 1600,
		quality = 0.8,
	}: { maxWidth?: number; maxHeight?: number; quality?: number } = {},
): Promise<File> {
	try {
		if (typeof document === "undefined") {
			return file;
		}
		const img = await loadImageFromFile(file);
		const { width, height } = img;
		const scale = Math.min(maxWidth / width, maxHeight / height, 1);
		const targetW = Math.round(width * scale);
		const targetH = Math.round(height * scale);

		const canvas = document.createElement("canvas");
		canvas.width = targetW;
		canvas.height = targetH;
		const ctx = canvas.getContext("2d", { alpha: true });
		if (!ctx) {
			return file;
		}
		ctx.drawImage(img, 0, 0, targetW, targetH);

		const blob = await new Promise<Blob | null>((resolve) =>
			canvas.toBlob(resolve, "image/webp", Math.min(Math.max(quality, 0.1), 0.95)),
		);
		if (!blob) {
			return file;
		}

		const base = file.name.replace(/\.[^.]+$/, "") || "image";
		return new File([blob], `${base}.webp`, { type: "image/webp" });
	} catch {
		return file;
	}
}

/* ==========================================================================
   HAPTIC FEEDBACK UTILITIES
   ========================================================================== */

export const hapticNavTap = () => {
	if (typeof navigator !== "undefined" && navigator.vibrate) {
		navigator.vibrate(10);
	}
};

export const hapticTournamentStart = () => {
	if (typeof navigator !== "undefined" && navigator.vibrate) {
		navigator.vibrate([50, 50, 50]);
	}
};

/* ==========================================================================
   SOUND MANAGER
   ========================================================================== */

interface SoundConfig {
	volume?: number;
	preload?: boolean;
}

class SoundManager {
	private audioCache: Map<string, HTMLAudioElement> = new Map();
	private defaultVolume = 0.3;

	constructor() {
		this.preloadSounds();
	}

	private preloadSounds() {
		const sounds: string[] = [];

		sounds.forEach((soundName) => {
			const audio = new Audio(`/assets/sounds/${soundName}.mp3`);
			audio.preload = "auto";
			audio.volume = this.defaultVolume;
			this.audioCache.set(soundName, audio);
		});
	}

	play(soundName: string, config: SoundConfig = {}) {
		try {
			const audio = this.audioCache.get(soundName);
			if (!audio) {
				console.warn(`Sound "${soundName}" not found in cache`);
				return;
			}

			const soundInstance = audio.cloneNode() as HTMLAudioElement;
			soundInstance.volume = config.volume ?? this.defaultVolume;
			soundInstance.currentTime = 0;

			const playPromise = soundInstance.play();

			if (playPromise !== undefined) {
				playPromise.catch((error) => {
					console.debug("Sound playback blocked by browser policy:", error);
				});
			}
		} catch (error) {
			console.warn("Error playing sound:", error);
		}
	}

	setDefaultVolume(volume: number) {
		this.defaultVolume = Math.max(0, Math.min(1, volume));
	}

	canPlaySounds(): boolean {
		const soundEnabled = localStorage.getItem("sound-enabled");
		if (soundEnabled === "false") {
			return false;
		}

		try {
			const AudioContextClass =
				window.AudioContext ||
				(window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
			const audioContext = new AudioContextClass();
			return audioContext.state !== "suspended";
		} catch {
			return false;
		}
	}
}

const soundManager = new SoundManager();

export const playSound = (soundName: string, config?: SoundConfig) => {
	if (soundManager.canPlaySounds()) {
		soundManager.play(soundName, config);
	}
};

/* ==========================================================================
   METRICS UTILITIES
   ========================================================================== */

const METRIC_LABELS: Record<string, string> = {
	rating: "Rating",
	total_wins: "Wins",
	selected: "Selected",
	avg_rating: "Avg Rating",
	wins: "Wins",
	dateSubmitted: "Date Added",
};

export function getMetricLabel(metricKey: string): string {
	return METRIC_LABELS[metricKey] || metricKey;
}

export function calculatePercentile(
	value: number,
	allValues: number[],
	higherIsBetter = true,
): number {
	if (!allValues || allValues.length === 0) {
		return 50;
	}

	const validValues = allValues.filter((v) => v != null && !Number.isNaN(v));
	if (validValues.length === 0) {
		return 50;
	}

	const sorted = [...validValues].sort((a, b) => a - b);

	if (higherIsBetter) {
		const belowCount = sorted.filter((v) => v < value).length;
		return Math.round((belowCount / sorted.length) * 100);
	} else {
		const aboveCount = sorted.filter((v) => v > value).length;
		return Math.round((aboveCount / sorted.length) * 100);
	}
}

export interface RatingData {
	rating: number;
	wins: number;
	losses: number;
}

export interface RatingItem extends RatingData {
	name: string;
}

export interface RatingDataInput {
	rating: number;
	wins?: number;
	losses?: number;
}

export function ratingsToArray(
	ratings: Record<string, RatingDataInput | number> | RatingItem[],
): RatingItem[] {
	if (Array.isArray(ratings)) {
		return ratings;
	}

	return Object.entries(ratings).map(([name, data]) => ({
		name,
		rating: typeof data === "number" ? data : (data as RatingDataInput)?.rating || 1500,
		wins: typeof data === "object" ? (data as RatingDataInput)?.wins || 0 : 0,
		losses: typeof data === "object" ? (data as RatingDataInput)?.losses || 0 : 0,
	}));
}

export function ratingsToObject(ratingsArray: RatingItem[]): Record<string, RatingData> {
	if (!Array.isArray(ratingsArray)) {
		return {};
	}

	return ratingsArray.reduce(
		(acc, item) => {
			acc[item.name] = {
				rating: item.rating || 1500,
				wins: item.wins || 0,
				losses: item.losses || 0,
			};
			return acc;
		},
		{} as Record<string, RatingData>,
	);
}
export * from "./performance";
