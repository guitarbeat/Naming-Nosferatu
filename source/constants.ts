/**
 * @module constants
 * @description Centralized application configuration and constants for consistency and maintainability.
 */

/* ==========================================================================
   CAT IMAGES
   ========================================================================== */

export const CAT_IMAGES = [
	"/assets/images/bby-cat.GIF",
	"/assets/images/cat.gif",
	"/assets/images/IMG_4844.avif",
	"/assets/images/IMG_4845.avif",
	"/assets/images/IMG_4846.avif",
	"/assets/images/IMG_4847.avif",
	"/assets/images/IMG_5044.avif",
	"/assets/images/IMG_5071.avif",
	"/assets/images/IMG_0778.avif",
	"/assets/images/IMG_0779.avif",
	"/assets/images/IMG_0865.avif",
	"/assets/images/IMG_0884.avif",
	"/assets/images/IMG_0923.avif",
	"/assets/images/IMG_1116.avif",
	"/assets/images/IMG_7205.avif",
	"/assets/images/75209580524__60DCC26F-55A1-4EF8-A0B2-14E80A026A8D.avif",
];

/* ==========================================================================
   FILTER OPTIONS
   ========================================================================== */

// * Filter Options
// * Simplified: names are either visible or hidden
// ts-prune-ignore-next (used via barrel export from core/constants)
export const FILTER_OPTIONS = {
	VISIBILITY: {
		ALL: "all",
		VISIBLE: "visible", // Default - show non-hidden names
		HIDDEN: "hidden", // Show only hidden names
	},
	USER: {
		ALL: "all",
		CURRENT: "current",
		OTHER: "other",
	},
	SORT: {
		RATING: "rating",
		NAME: "name",
		WINS: "wins",
		LOSSES: "losses",
		WIN_RATE: "winRate",
		CREATED: "created",
	},
	ORDER: {
		ASC: "asc",
		DESC: "desc",
	},
};

// * Validation Constants
// ts-prune-ignore-next (used via barrel export from core/constants)
export const VALIDATION = {
	MIN_NAME_LENGTH: 1,
	MAX_NAME_LENGTH: 50,
	MIN_DESCRIPTION_LENGTH: 0,
	MAX_DESCRIPTION_LENGTH: 500,
	USERNAME_PATTERN: /^[a-zA-Z0-9_-]+$/,
	EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
	// * Tournament validation
	MIN_TOURNAMENT_SIZE: 2,
	MAX_TOURNAMENT_SIZE: 64,
	MIN_RATING: 0,
	MAX_RATING: 3000,
	// * Username validation
	MIN_USERNAME_LENGTH: 2,
	MAX_USERNAME_LENGTH: 50,
	USERNAME_PATTERN_EXTENDED: /^[a-zA-Z0-9\s\-_]+$/,
	// * Cat name validation
	MIN_CAT_NAME_LENGTH: 1,
	MAX_CAT_NAME_LENGTH: 100,
	// * Description validation
	MIN_DESCRIPTION_LENGTH_EXTENDED: 10,
};

// * Tournament Timing Constants
// ts-prune-ignore-next (used via barrel export from core/constants)
export const TOURNAMENT_TIMING = {
	VOTE_COOLDOWN: 150, // Reduced from 300ms for faster voting
	UNDO_WINDOW_MS: 2000,
	MATCH_RESULT_SHOW_DELAY: 200, // Reduced from 300ms
	MATCH_RESULT_HIDE_DELAY: 800, // Reduced from 1200ms
	TOAST_SUCCESS_DURATION: 1500, // Reduced from 2000ms
	TOAST_ERROR_DURATION: 3000, // Reduced from 3500ms
	RENDER_LOG_THROTTLE: 1000,
	ROUND_TRANSITION_DELAY: 600, // Reduced from 1000ms
	UNDO_UPDATE_INTERVAL: 200,
	TRANSITION_DELAY_SHORT: 50, // Reduced from 80ms
	TRANSITION_DELAY_MEDIUM: 100, // Reduced from 150ms
};

// * General Timing Constants
// ts-prune-ignore-next (used via barrel export from core/constants)
export const TIMING = {
	// Network and API timeouts
	SUPABASE_CLIENT_TIMEOUT_MS: 10000,
	// Animation durations
	RIPPLE_ANIMATION_DURATION_MS: 600,
	EAR_TWITCH_DURATION_MS: 150,
	LIGHTBOX_TRANSITION_DURATION_MS: 300,
	// Debounce and throttle delays
	SAVE_DEBOUNCE_DELAY_MS: 500,
	// Status message display durations
	STATUS_SUCCESS_DISPLAY_DURATION_MS: 2000,
	STATUS_ERROR_DISPLAY_DURATION_MS: 3000,
	// Check intervals
	PAUSE_CHECK_INTERVAL_MS: 1000,
	LONG_PRESS_TIMEOUT_MS: 1000,
	// Pause detection
	IDLE_PAUSE_THRESHOLD_MS: 5000,
};

// * Toast and Notification Constants
// ts-prune-ignore-next (used via barrel export from core/constants)
export const NOTIFICATION = {
	DEFAULT_DURATION_MS: 5000,
	ERROR_DURATION_MS: 7000,
	SUCCESS_DURATION_MS: 5000,
	MAX_TOASTS: 5,
};

// * Elo Rating System Constants
// ts-prune-ignore-next (used via barrel export from core/constants)
export const ELO_RATING = {
	DEFAULT_RATING: 1500,
	DEFAULT_K_FACTOR: 40,
	MIN_RATING: 800,
	MAX_RATING: 2400,
	RATING_DIVISOR: 400,
	// Rating thresholds for K-factor adjustment
	LOW_RATING_THRESHOLD: 1400,
	HIGH_RATING_THRESHOLD: 2000,
	// Game count threshold for K-factor adjustment
	NEW_PLAYER_GAME_THRESHOLD: 15,
	// K-factor multipliers
	NEW_PLAYER_K_MULTIPLIER: 2,
	EXTREME_RATING_K_MULTIPLIER: 1.5,
	// Match outcome scores
	WIN_SCORE: 1,
	LOSS_SCORE: 0,
	BOTH_WIN_SCORE: 0.7,
	NEITHER_WIN_SCORE: 0.3,
	TIE_SCORE: 0.5,
};

// * Mobile Gesture Thresholds

// * Local Storage Keys
// ts-prune-ignore-next (used via barrel export from core/constants)
export const STORAGE_KEYS = {
	USER: "catNamesUser",
	USER_AVATAR: "catNamesUserAvatar",
	THEME: "theme",
	SWIPE_MODE: "tournamentSwipeMode",
	TOURNAMENT: "tournament-storage",
	USER_STORAGE: "user-storage",
	ANALYSIS_DASHBOARD_COLLAPSED: "analysis-dashboard-collapsed",
	ADMIN_ANALYTICS_COLLAPSED: "admin-analytics-collapsed",
	NAVBAR_COLLAPSED: "navbar-collapsed",
	SOUND_ENABLED: "soundEnabled",
	MUSIC_VOLUME: "musicVolume",
	EFFECTS_VOLUME: "effectsVolume",
} as const;

/**
 * @file basic.ts
 * @description Consolidated basic utility functions for common tasks
 * Combines: array manipulation, caching, date formatting, and logging
 */

import type { NameItem } from "@/appTypes";
import { queryClient } from "./services/supabase/client";

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

const isDevelopment = process.env.NODE_ENV === "development";

const performanceMetrics = {
	metrics: {} as Record<string, number>,
	observers: [] as PerformanceObserver[],
};

function reportNavigationMetrics() {
	if (typeof window === "undefined") {
		return;
	}
	const timing = (window.performance as unknown as { timing: PerformanceTiming })?.timing;
	if (!timing) {
		return;
	}

	const { navigationStart } = timing;
	const domContentLoadedTime = timing.domContentLoadedEventEnd - navigationStart;
	const loadCompleteTime = timing.loadEventEnd - navigationStart;
	const connectTime = timing.responseEnd - timing.requestStart;

	performanceMetrics.metrics.domContentLoaded = domContentLoadedTime;
	performanceMetrics.metrics.loadComplete = loadCompleteTime;
	performanceMetrics.metrics.connect = connectTime;

	console.debug(`[Performance] DOM Content Loaded: ${domContentLoadedTime}ms`);
	console.debug(`[Performance] Page Load Complete: ${loadCompleteTime}ms`);
	console.debug(`[Performance] Server Connect Time: ${connectTime}ms`);
}

export function initializePerformanceMonitoring() {
	if (!isDevelopment || typeof window === "undefined") {
		return;
	}

	if (
		window.performance &&
		(window.performance as unknown as { timing: PerformanceTiming }).timing
	) {
		window.addEventListener("load", () => {
			setTimeout(() => {
				reportNavigationMetrics();
			}, 0);
		});
	}

	if ("PerformanceObserver" in window) {
		try {
			const lcpObserver = new PerformanceObserver((list) => {
				const entries = list.getEntries();
				const lastEntry = entries[entries.length - 1] as unknown as {
					renderTime: number;
					loadTime: number;
				};
				performanceMetrics.metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
				console.debug(
					`[Performance] Largest Contentful Paint: ${performanceMetrics.metrics.lcp}ms`,
				);
			});
			lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
			performanceMetrics.observers.push(lcpObserver);
		} catch {
			console.debug("LCP observer not supported");
		}

		try {
			let clsValue = 0;
			const clsObserver = new PerformanceObserver((list) => {
				for (const entry of list.getEntries() as unknown as {
					hadRecentInput: boolean;
					value: number;
				}[]) {
					if (!entry.hadRecentInput) {
						clsValue += entry.value;
						performanceMetrics.metrics.cls = clsValue;
						console.debug(`[Performance] Cumulative Layout Shift: ${clsValue.toFixed(3)}`);
					}
				}
			});
			clsObserver.observe({ type: "layout-shift", buffered: true });
			performanceMetrics.observers.push(clsObserver);
		} catch {
			console.debug("CLS observer not supported");
		}

		try {
			const fidObserver = new PerformanceObserver((list) => {
				const entries = list.getEntries();
				entries.forEach((entry: PerformanceEntry) => {
					const eventEntry = entry as unknown as { processingDuration: number };
					performanceMetrics.metrics.fid = eventEntry.processingDuration;
					console.debug(`[Performance] First Input Delay: ${eventEntry.processingDuration}ms`);
				});
			});
			fidObserver.observe({ type: "first-input", buffered: true });
			performanceMetrics.observers.push(fidObserver);
		} catch {
			console.debug("FID observer not supported");
		}

		try {
			const fcpObserver = new PerformanceObserver((list) => {
				const entries = list.getEntries();
				entries.forEach((entry) => {
					if (entry.name === "first-contentful-paint") {
						performanceMetrics.metrics.fcp = entry.startTime;
						console.debug(`[Performance] First Contentful Paint: ${entry.startTime}ms`);
					}
				});
			});
			fcpObserver.observe({ type: "paint", buffered: true });
			performanceMetrics.observers.push(fcpObserver);
		} catch {
			console.debug("FCP observer not supported");
		}
	}
}

export function cleanupPerformanceMonitoring() {
	performanceMetrics.observers.forEach((observer) => {
		try {
			observer.disconnect();
		} catch (error) {
			console.debug("Error disconnecting observer:", error);
		}
	});
	performanceMetrics.observers = [];
}
/**
 * @module icons
 * @description Single icon source for the app. All UI icons are re-exported from lucide-react here
 * so we depend on one library and one import path. Swap or add icons in this file only.
 */

export {
	BarChart3,
	Cat,
	Check,
	CheckCircle,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Copy,
	Download,
	GripVertical,
	Heart,
	Layers,
	LayoutGrid,
	Lightbulb,
	Loader2,
	LogOut,
	PawPrint,
	Pencil,
	Plus,
	Save,
	Shuffle,
	Trophy,
	Upload,
	User,
	X,
} from "lucide-react";
