import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { NameItem, RatingData, RatingInput } from "@/types";

/* ==========================================================================
   CONSTANTS
   ========================================================================== */

export const CAT_IMAGES: readonly string[] = [
	"/assets/images/cats/cat_01.webp",
	"/assets/images/cats/cat_02.webp",
	"/assets/images/cats/cat_03.webp",
	"/assets/images/cats/cat_04.webp",
	"/assets/images/cats/cat_05.webp",
	"/assets/images/cats/cat_06.webp",
	"/assets/images/cats/cat_07.webp",
	"/assets/images/cats/cat_08.webp",
	"/assets/images/cats/cat_09.webp",
	"/assets/images/cats/cat_10.webp",
	"/assets/images/cats/cat_11.webp",
	"/assets/images/cats/cat_12.webp",
	"/assets/images/cats/cat_13.webp",
	"/assets/images/cats/cat_14.webp",
] as const;

export const FALLBACK_CAT_IMAGE = "/assets/images/ui/cat_avatar_placeholder.png";

export const FALLBACK_CAT_SVG =
	"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%236366f1'><circle cx='50' cy='50' r='45'/><text x='50' y='65' font-size='40' text-anchor='middle' fill='white'>🐱</text></svg>";

export const CRITICAL_SHELL_IMAGES: readonly string[] = [FALLBACK_CAT_IMAGE] as const;

export const STORAGE_KEYS = {
	USER: "nn_user",
	USER_ID: "nn_user_id",
	USER_AVATAR: "nn_user_avatar",
	USER_STORAGE: "nn_user_storage",
	TOURNAMENT: "nn_tournament",
	THEME: "nn_theme",
} as const;

export const ELO_RATING = {
	DEFAULT_RATING: 1200,
	DEFAULT_K_FACTOR: 32,
	RATING_DIVISOR: 400,
	MIN_RATING: 100,
	MAX_RATING: 3000,
	NEW_PLAYER_GAME_THRESHOLD: 10,
	NEW_PLAYER_K_MULTIPLIER: 1.5,
} as const;

export const TIMING = {
	VOTE_COOLDOWN_MS: 300,
} as const;

export const MOTION_DURATIONS = {
	reducedMotionDuration: 0.01,
	fast: 0.15,
	base: 0.2,
	moderate: 0.35,
	gentle: 0.5,
} as const;

export const fadeMotionPreset = {
	initial: { opacity: 0 },
	animate: { opacity: 1 },
	exit: { opacity: 0 },
	transition: { duration: MOTION_DURATIONS.base },
} as const;

export const scaleFadeMotionPreset = {
	initial: { opacity: 0, scale: 0.95 },
	animate: { opacity: 1, scale: 1 },
	exit: { opacity: 0, scale: 0.95 },
	transition: { duration: MOTION_DURATIONS.base },
} as const;

/* ==========================================================================
   LOGGER
   ========================================================================== */

class Logger {
	private isDev = Boolean(import.meta.env?.DEV);

	debug(...args: unknown[]): void {
		if (this.isDev) {
			console.debug("[DEBUG]", ...args);
		}
	}

	info(...args: unknown[]): void {
		console.info("[INFO]", ...args);
	}

	warn(...args: unknown[]): void {
		console.warn("[WARN]", ...args);
	}

	error(...args: unknown[]): void {
		console.error("[ERROR]", ...args);
	}
}

export const logger = new Logger();

/* ==========================================================================
   ELO CALCULATION
   ========================================================================== */

export interface EloConfig {
	kFactor?: number;
	defaultRating?: number;
	minRating?: number;
	maxRating?: number;
	ratingDivisor?: number;
	newPlayerGameThreshold?: number;
	newPlayerKMultiplier?: number;
}

export function getExpectedEloScore(
	ra: number,
	rb: number,
	options?: { ratingDivisor?: number },
): number {
	const divisor = options?.ratingDivisor ?? 400;
	return 1 / (1 + 10 ** ((rb - ra) / divisor));
}

export function calculatePairEloUpdate({
	leftRating,
	rightRating,
	outcome,
	leftStats,
	rightStats,
	config,
}: {
	leftRating: number;
	rightRating: number;
	outcome: "left" | "right" | "tie";
	leftStats?: { wins?: number; losses?: number };
	rightStats?: { wins?: number; losses?: number };
	config?: EloConfig;
}): {
	newRatingA: number;
	newRatingB: number;
	winsA: number;
	lossesA: number;
	winsB: number;
	lossesB: number;
} {
	const divisor = config?.ratingDivisor ?? 400;
	const minR = config?.minRating ?? 100;
	const maxR = config?.maxRating ?? 3000;
	const k = config?.kFactor ?? 32;

	const expectedA = 1 / (1 + 10 ** ((rightRating - leftRating) / divisor));
	const expectedB = 1 - expectedA;

	const actualA = outcome === "left" ? 1 : outcome === "right" ? 0 : 0.5;
	const actualB = 1 - actualA;

	const winsA = (leftStats?.wins ?? 0) + (outcome === "left" ? 1 : 0);
	const lossesA = (leftStats?.losses ?? 0) + (outcome === "right" ? 1 : 0);
	const winsB = (rightStats?.wins ?? 0) + (outcome === "right" ? 1 : 0);
	const lossesB = (rightStats?.losses ?? 0) + (outcome === "left" ? 1 : 0);

	const gamesA = winsA + lossesA;
	const gamesB = winsB + lossesB;

	const threshold = config?.newPlayerGameThreshold ?? 10;
	const multiplier = config?.newPlayerKMultiplier ?? 1.5;

	const kA = gamesA < threshold ? k * multiplier : k;
	const kB = gamesB < threshold ? k * multiplier : k;

	const newRatingA = Math.round(
		Math.min(maxR, Math.max(minR, leftRating + kA * (actualA - expectedA))),
	);
	const newRatingB = Math.round(
		Math.min(maxR, Math.max(minR, rightRating + kB * (actualB - expectedB))),
	);

	return {
		newRatingA,
		newRatingB,
		winsA,
		lossesA,
		winsB,
		lossesB,
	};
}

export function applyEloMatchUpdate({
	ratings,
	leftParticipantIds,
	rightParticipantIds,
	winnerSide,
	config,
}: {
	ratings: Record<string, number>;
	leftParticipantIds: (string | number)[];
	rightParticipantIds: (string | number)[];
	winnerSide: "left" | "right" | "tie";
	config?: EloConfig;
}): { ratings: Record<string, number> } {
	const updatedRatings = { ...ratings };
	const defaultRating = config?.defaultRating ?? 1200;

	let sumLeft = 0;
	for (let i = 0; i < leftParticipantIds.length; i++) {
		sumLeft += Number(ratings[String(leftParticipantIds[i])]) || defaultRating;
	}
	const avgLeftRating = sumLeft / (leftParticipantIds.length || 1);

	let sumRight = 0;
	for (let i = 0; i < rightParticipantIds.length; i++) {
		sumRight += Number(ratings[String(rightParticipantIds[i])]) || defaultRating;
	}
	const avgRightRating = sumRight / (rightParticipantIds.length || 1);

	const { newRatingA, newRatingB } = calculatePairEloUpdate({
		leftRating: avgLeftRating,
		rightRating: avgRightRating,
		outcome: winnerSide,
		config,
	});

	const deltaA = newRatingA - avgLeftRating;
	const deltaB = newRatingB - avgRightRating;

	for (const id of leftParticipantIds) {
		const curr = Number(ratings[String(id)]) || defaultRating;
		updatedRatings[String(id)] = Math.round(curr + deltaA);
	}
	for (const id of rightParticipantIds) {
		const curr = Number(ratings[String(id)]) || defaultRating;
		updatedRatings[String(id)] = Math.round(curr + deltaB);
	}

	return { ratings: updatedRatings };
}

/* ==========================================================================
   DEFAULT NAMES & NAME HELPERS
   ========================================================================== */

export const DEFAULT_SAMPLE_NAMES: NameItem[] = [
	{ id: "1", name: "Nosferatu", description: "The immortal feline count with shadowy charm" },
	{ id: "2", name: "Luna", description: "Graceful and mysterious moonlit tabby" },
	{ id: "3", name: "Miso", description: "Sweet and playful companion who purrs like an engine" },
	{ id: "4", name: "Pixel", description: "Tech-savvy, energetic, and clever troublemaker" },
	{ id: "5", name: "Saffron", description: "Warm and spicy personality with golden fur" },
	{ id: "6", name: "Noodle", description: "Long, stretchy acrobatic champion" },
	{ id: "7", name: "Ziggy", description: "Bold and energetic fearless explorer" },
	{ id: "8", name: "Whiskers", description: "Classic, timeless, and distinguished gentlegato" },
	{ id: "9", name: "Pepper", description: "Small but mighty whirlwind of energy" },
	{ id: "10", name: "Shadow", description: "Silent stalker of dust motes and midnight zoomies" },
	{ id: "11", name: "Milo", description: "Friendly adventurer with curious streak" },
	{ id: "12", name: "Barnaby", description: "Dignified floof with a heart of gold" },
	{ id: "13", name: "Binx", description: "The cunning black cat with ancient magical flair" },
	{ id: "14", name: "Cleo", description: "Regal Egyptian queen who demands undivided devotion" },
	{ id: "15", name: "Oliver", description: "Gentle soul with a weakness for cozy warm blankets" },
	{
		id: "16",
		name: "Felix",
		description: "Lucky charmer who always lands gracefully on all four paws",
	},
	{
		id: "17",
		name: "Jasper",
		description: "Spotted rascal with emerald eyes and mischievous spirit",
	},
	{ id: "18", name: "Gizmo", description: "Curious tinkerer fascinated by crinkly paper bags" },
	{
		id: "19",
		name: "Salem",
		description: "Snarky, articulate familiar with an exquisite taste for drama",
	},
	{
		id: "20",
		name: "Poppy",
		description: "Bouncy, cheerful calico bringing sunshine to every room",
	},
	{
		id: "21",
		name: "Willow",
		description: "Serene and poetic spirit who naps exclusively in sunbeams",
	},
	{ id: "22", name: "Archie", description: "Dapper ginger dynamo brimming with unending charisma" },
	{ id: "23", name: "Thor", description: "Thunderous purr machine with mighty pouncing power" },
	{ id: "24", name: "Loki", description: "Master of trickery and midnight sock burglary" },
	{
		id: "25",
		name: "Simon",
		description: "Talkative companion who always gets the very last word",
	},
	{
		id: "26",
		name: "Casper",
		description: "Friendly white phantom who glides silently through hallways",
	},
	{ id: "27", name: "Bandit", description: "Masked sweetheart who steals hearts and hair ties" },
	{
		id: "28",
		name: "Marmalade",
		description: "Sun-ripened orange tabby packed with pure sweetness",
	},
	{
		id: "29",
		name: "Zelda",
		description: "Princess of the castle with a courageous adventurous spirit",
	},
	{ id: "30", name: "Cosmo", description: "Dreamy space cadet gazing thoughtfully at the stars" },
	{
		id: "31",
		name: "Clover",
		description: "Lucky four-leaf feline spreading peace and good fortune",
	},
	{ id: "32", name: "Hazel", description: "Gentle observer with warm amber eyes and headbutts" },
	{
		id: "33",
		name: "Waffles",
		description: "Golden, warm, and everyone's favorite cuddle companion",
	},
	{
		id: "34",
		name: "Peanut",
		description: "Tiny peanut-whiskered squeaker with giant feline bravery",
	},
	{ id: "35", name: "Tofu", description: "Soft, squishy cloud of marshmallow innocence and calm" },
	{ id: "36", name: "Boba", description: "Sweet boba pearl eyes that can melt any human heart" },
	{
		id: "37",
		name: "Fig",
		description: "Pocket-sized sweetie who chirps delightfully like a songbird",
	},
	{
		id: "38",
		name: "Dumpling",
		description: "Chonky delight specialized in world-class competitive loafing",
	},
	{
		id: "39",
		name: "Pippin",
		description: "Halfling at heart, perpetually ready for second breakfast",
	},
	{
		id: "40",
		name: "Otis",
		description: "Old-school sweetheart who greets everyone right at the door",
	},
	{ id: "41", name: "Boris", description: "Philosophical aristocrat fond of quiet afternoons" },
	{
		id: "42",
		name: "Clementine",
		description: "Bright citrus darling with sweet sunny disposition",
	},
	{ id: "43", name: "Gatsby", description: "Lavish socialite hosting grand cardboard box soirees" },
	{
		id: "44",
		name: "Penelope",
		description: "Sophisticated lady with pristine white paws and whiskers",
	},
	{ id: "45", name: "Goose", description: "Silly goose masquerading as a ferocious predator" },
	{ id: "46", name: "Basil", description: "Fresh aromatic garden companion with a spicy spark" },
	{ id: "47", name: "Churro", description: "Sweet cinnamon swirl of high-speed zoomie joy" },
	{ id: "48", name: "Mochi", description: "Stretchy, lovable sweet treat of a dedicated lap cat" },
	{
		id: "49",
		name: "Finnegan",
		description: "Spirited Irish rogue always up for playful evening antics",
	},
	{
		id: "50",
		name: "Matilda",
		description: "Clever bookworm perched proudly on the highest shelf",
	},
	{
		id: "51",
		name: "Klaus",
		description: "Sharp, brooding silhouette with the softest gentle purrs",
	},
	{ id: "52", name: "Nutmeg", description: "Autumn-spiced cutie who adores crunchy autumn leaves" },
	{ id: "53", name: "Suki", description: "Dearest treasure with ninja stealth and swift pounces" },
	{ id: "54", name: "Atticus", description: "Wise and fair arbiter of household sunny spots" },
	{
		id: "55",
		name: "Bluebell",
		description: "Delicate woodland flower with a soothing gentle presence",
	},
	{ id: "56", name: "Rolo", description: "Caramel-filled sweetie with a rich and lustrous coat" },
];

export function normalizeRatingsWithStats(
	ratings: Record<string, RatingInput | undefined> | null | undefined,
): Record<string, RatingData> {
	if (!ratings) {
		return {};
	}
	const result: Record<string, RatingData> = {};
	for (const id of Object.keys(ratings)) {
		const entry = ratings[id];
		if (entry == null) {
			continue;
		}
		if (typeof entry === "number") {
			result[id] = { rating: entry, wins: 0, losses: 0 };
		} else {
			result[id] = {
				rating: typeof entry.rating === "number" ? entry.rating : 1500,
				wins: typeof entry.wins === "number" ? entry.wins : 0,
				losses: typeof entry.losses === "number" ? entry.losses : 0,
			};
		}
	}
	return result;
}

export function isNameHidden(name: NameItem | null | undefined): boolean {
	return Boolean(name && (name.is_hidden === true || name.isHidden === true));
}

export function isNameLocked(name: NameItem | null | undefined): boolean {
	return Boolean(name && (name.locked_in === true || name.lockedIn === true));
}

export function isNameActive(name: NameItem | null | undefined): boolean {
	return Boolean(name && !isNameHidden(name) && !isNameLocked(name));
}

export function getVisibleNames(names: NameItem[] | null | undefined): NameItem[] {
	if (!Array.isArray(names)) {
		return [];
	}
	const result: NameItem[] = [];
	for (let i = 0; i < names.length; i++) {
		const name = names[i];
		if (!isNameHidden(name)) {
			result.push(name);
		}
	}
	return result;
}

export function getActiveNames(names: NameItem[] | null | undefined): NameItem[] {
	if (!Array.isArray(names)) {
		return [];
	}
	const result: NameItem[] = [];
	for (let i = 0; i < names.length; i++) {
		const name = names[i];
		if (isNameActive(name)) {
			result.push(name);
		}
	}
	return result;
}

export function getHiddenNames(names: NameItem[] | null | undefined): NameItem[] {
	if (!Array.isArray(names)) {
		return [];
	}
	const result: NameItem[] = [];
	for (let i = 0; i < names.length; i++) {
		const name = names[i];
		if (isNameHidden(name)) {
			result.push(name);
		}
	}
	return result;
}

export function getLockedNames(names: NameItem[] | null | undefined): NameItem[] {
	if (!Array.isArray(names)) {
		return [];
	}
	const result: NameItem[] = [];
	for (let i = 0; i < names.length; i++) {
		const name = names[i];
		if (isNameLocked(name)) {
			result.push(name);
		}
	}
	return result;
}

export function matchesNameSearchTerm(
	name: NameItem | null | undefined,
	searchTerm: string,
): boolean {
	const normalizedTerm = searchTerm.trim().toLowerCase();
	if (!normalizedTerm) {
		return true;
	}

	if (!name) {
		return false;
	}

	return (
		name.name.toLowerCase().includes(normalizedTerm) ||
		(name.description ?? "").toLowerCase().includes(normalizedTerm)
	);
}

/* ==========================================================================
   UI, SYSTEM & IMAGE UTILS
   ========================================================================== */

const catImageCache = new Map<string, string>();
const MAX_CAT_IMAGE_CACHE_SIZE = 256;

export function isSaveDataMode(): boolean {
	if (typeof navigator === "undefined") {
		return false;
	}
	const connection = (
		navigator as unknown as {
			connection?: { saveData?: boolean; effectiveType?: string };
		}
	).connection;
	return Boolean(
		connection?.saveData ||
			connection?.effectiveType === "slow-2g" ||
			connection?.effectiveType === "2g",
	);
}

export function isMobileOrLowPowerDevice(): boolean {
	if (typeof window === "undefined") {
		return false;
	}
	if (isSaveDataMode()) {
		return true;
	}
	const isSmallScreen = window.innerWidth <= 768;
	const isCoarsePointer =
		typeof window.matchMedia === "function" &&
		Boolean(window.matchMedia("(pointer: coarse)").matches);
	const hasLowConcurrency =
		typeof navigator !== "undefined" && (navigator.hardwareConcurrency ?? 8) <= 4;
	return Boolean(isSmallScreen || (isCoarsePointer && hasLowConcurrency));
}

export function getRandomCatImage(
	id: string | number,
	images: readonly string[] = CAT_IMAGES,
	fallbackName?: string,
): string {
	if (!images || images.length === 0) {
		return "";
	}
	const cacheKey = `${id}-${fallbackName || ""}`;
	const cached = catImageCache.get(cacheKey);
	if (cached !== undefined) {
		return cached;
	}

	let hash = 0;
	for (let i = 0; i < cacheKey.length; i++) {
		hash = (hash << 5) - hash + cacheKey.charCodeAt(i);
		hash |= 0;
	}
	const index = Math.abs(hash) % images.length;
	const result = images[index] ?? images[0] ?? "";

	if (catImageCache.size >= MAX_CAT_IMAGE_CACHE_SIZE) {
		const firstKey = catImageCache.keys().next().value;
		if (firstKey !== undefined) {
			catImageCache.delete(firstKey);
		}
	}
	catImageCache.set(cacheKey, result);

	return result;
}

export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}

export function shuffleArray<T>(array: T[]): T[] {
	const next = [...array];
	const randomBuffer = new Uint32Array(1);
	for (let i = next.length - 1; i > 0; i -= 1) {
		crypto.getRandomValues(randomBuffer);
		const randomFloat = (randomBuffer[0] as number) / (0xffffffff + 1);
		const j = Math.floor(randomFloat * (i + 1));
		const temp = next[i] as T;
		next[i] = next[j] as T;
		next[j] = temp;
	}
	return next;
}

export function createSortedKey(
	items: Array<string | number | { id: string | number } | null | undefined>,
): string {
	const validItems: string[] = [];
	for (let i = 0; i < items.length; i++) {
		const item = items[i];
		const val = item && typeof item === "object" ? item.id : item;
		if (val) {
			validItems.push(String(val));
		}
	}
	return validItems.sort().join(",");
}

export function hapticNavTap(): void {
	if (typeof navigator !== "undefined") {
		navigator.vibrate?.(10);
	}
}

export function hapticVoteTap(durationMs = 15): boolean {
	if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
		try {
			return navigator.vibrate(durationMs);
		} catch {
			return false;
		}
	}
	return false;
}

export function handleImgError(
	e: React.SyntheticEvent<HTMLImageElement, Event>,
	fallbackSrc: string = FALLBACK_CAT_SVG,
): void {
	if (e.currentTarget.src !== fallbackSrc) {
		e.currentTarget.src = fallbackSrc;
	}
}

export function setupGlobalImageErrorHandler(
	fallbackSrc: string = FALLBACK_CAT_SVG,
	localFallback: string = FALLBACK_CAT_IMAGE,
): () => void {
	if (typeof window === "undefined") {
		return () => {
			/* no-op */
		};
	}

	const handleImageError = (event: Event) => {
		const target = event.target;
		if (!(target instanceof HTMLImageElement)) {
			return;
		}

		if (target.dataset.fallbackApplied === "true") {
			if (target.src !== fallbackSrc) {
				target.src = fallbackSrc;
			}
			return;
		}

		target.dataset.fallbackApplied = "true";
		target.dataset.originalSrc = target.currentSrc || target.src;
		target.classList.add("img-fallback-applied");

		const isFailedLocal = target.src.includes(localFallback);
		target.src = isFailedLocal ? fallbackSrc : localFallback;
	};

	window.addEventListener("error", handleImageError, true);

	return () => {
		window.removeEventListener("error", handleImageError, true);
	};
}

export const ErrorManager = {
	setupGlobalErrorHandling() {
		const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
			console.error("Unhandled Promise Rejection:", event.reason);
			ErrorManager.handleError(event.reason);
		};

		const handleErrorEvent = (event: ErrorEvent) => {
			console.error("Global Error:", event.error);
			ErrorManager.handleError(event.error);
		};

		window.addEventListener("unhandledrejection", handleUnhandledRejection);
		window.addEventListener("error", handleErrorEvent);
		const cleanupImageErrorHandler = setupGlobalImageErrorHandler();

		return () => {
			window.removeEventListener("unhandledrejection", handleUnhandledRejection);
			window.removeEventListener("error", handleErrorEvent);
			cleanupImageErrorHandler();
		};
	},

	handleError(
		error: unknown,
		context?: string,
		options?: { componentStack?: string | null; isCritical?: boolean },
	): { id: string } {
		const errorMessage =
			error instanceof Error
				? error.message
				: typeof error === "string"
					? error
					: "An unexpected error occurred.";
		let randomString: string;
		if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
			randomString = crypto.randomUUID();
		} else if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
			const array = new Uint8Array(8);
			crypto.getRandomValues(array);
			randomString = Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
		} else {
			randomString = Math.random().toString(36).slice(2, 10);
		}
		const id = `err_${Date.now()}_${randomString}`;
		if (context) {
			console.error(`[${context}] Error:`, error, options);
		} else {
			console.error("Error:", error);
		}
		if (typeof window !== "undefined") {
			window.dispatchEvent(
				new CustomEvent("app-error", {
					detail: {
						id,
						message: errorMessage,
						isCritical: options?.isCritical,
					},
				}),
			);
		}
		return { id };
	},
};
