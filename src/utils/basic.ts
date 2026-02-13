/**
 * @file basic.ts
 * @description Barrel export for all basic utility functions
 * Modules are split by concern: array, cache, date, logging, csv, image, filter, display, classname, haptic, sound, metrics
 */

// Array utilities
export { shuffleArray } from "./array";

// Cache utilities
export { clearAllCaches, clearTournamentCache } from "./cache";
// Classname utilities
export { cn } from "./classname";
// CSV export utilities
export { exportTournamentResultsToCSV } from "./csv";
// Date utilities
export { formatDate } from "./date";
// Display utilities
export { getRankDisplay } from "./display";

// Filter/visibility utilities
export {
	applyNameFilters,
	type FilterOptions,
	getVisibleNames,
	isNameHidden,
	mapFilterStatusToVisibility,
	selectedNamesToSet,
} from "./filter";
// Haptic utilities
export { hapticNavTap, hapticTournamentStart } from "./haptic";
// Image utilities
export { compressImageFile, fetchCatAvatars, getRandomCatImage } from "./image";
// Logging utilities
export { devError, devLog, devWarn } from "./logging";
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
// Sound utilities
export { playSound } from "./sound";
