/**
 * @file basic.ts
 * @description Barrel export for all basic utility functions
 * Modules are split by concern: array, cache, date, logging, csv, image, filter, display, classname, haptic, sound, metrics
 */

// Array utilities
export { shuffleArray } from "./array";

// Cache utilities
export { clearAllCaches, clearTournamentCache } from "./cache";

// Date utilities
export { formatDate } from "./date";

// Logging utilities
export { devError, devLog, devWarn } from "./logging";

// CSV export utilities
export { exportTournamentResultsToCSV } from "./csv";

// Image utilities
export { compressImageFile, fetchCatAvatars, getRandomCatImage } from "./image";

// Filter/visibility utilities
export {
	type FilterOptions,
	applyNameFilters,
	getVisibleNames,
	isNameHidden,
	mapFilterStatusToVisibility,
	selectedNamesToSet,
} from "./filter";

// Classname utilities
export { cn } from "./classname";

// Display utilities
export { getRankDisplay } from "./display";

// Haptic utilities
export { hapticNavTap, hapticTournamentStart } from "./haptic";

// Sound utilities
export { playSound } from "./sound";

// Metrics utilities
export {
	calculatePercentile,
	getMetricLabel,
	type RatingData,
	type RatingDataInput,
	type RatingItem,
	ratingsToArray,
	ratingsToObject,
} from "./metrics";

// Re-export performance from original location (not changed)
export * from "./performance";
