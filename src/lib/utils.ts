import { type ClassValue, clsx } from "clsx";
import type React from "react";
import { twMerge } from "tailwind-merge";
import type { NameItem, RatingData, RatingInput } from "@/types";

export const CAT_IMAGES: readonly string[] = Array.from(
	{ length: 14 },
	(_, i) => `/assets/images/cats/cat_${String(i + 1).padStart(2, "0")}.webp`,
);

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
	THEME: "nn_theme_v2",
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

export const TIMING = { VOTE_COOLDOWN_MS: 260 } as const;

export const MOTION_DURATIONS = {
	reducedMotionDuration: 0.01,
	fast: 0.15,
	base: 0.2,
	moderate: 0.3,
} as const;

export const fadeMotionPreset = {
	initial: { opacity: 0 },
	animate: { opacity: 1 },
	exit: { opacity: 0 },
	transition: { duration: MOTION_DURATIONS.base },
} as const;

export const scaleFadeMotionPreset = {
	initial: { opacity: 0, scale: 0.96 },
	animate: { opacity: 1, scale: 1 },
	exit: { opacity: 0, scale: 0.96 },
	transition: { duration: MOTION_DURATIONS.base },
} as const;

export const logger = {
	error: (...args: unknown[]) => console.error("[ERROR]", ...args),
	warn: (...args: unknown[]) => console.warn("[WARN]", ...args),
	info: (...args: unknown[]) => console.info("[INFO]", ...args),
};

export interface EloConfig {
	kFactor?: number;
	defaultRating?: number;
	minRating?: number;
	maxRating?: number;
	ratingDivisor?: number;
	newPlayerGameThreshold?: number;
	newPlayerKMultiplier?: number;
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
}) {
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

	const threshold = config?.newPlayerGameThreshold ?? 10;
	const multiplier = config?.newPlayerKMultiplier ?? 1.5;
	const kA = winsA + lossesA < threshold ? k * multiplier : k;
	const kB = winsB + lossesB < threshold ? k * multiplier : k;

	return {
		newRatingA: Math.round(Math.min(maxR, Math.max(minR, leftRating + kA * (actualA - expectedA)))),
		newRatingB: Math.round(
			Math.min(maxR, Math.max(minR, rightRating + kB * (actualB - expectedB))),
		),
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
	for (const id of leftParticipantIds) {
		sumLeft += Number(ratings[String(id)]) || defaultRating;
	}
	const avgLeft = sumLeft / (leftParticipantIds.length || 1);

	let sumRight = 0;
	for (const id of rightParticipantIds) {
		sumRight += Number(ratings[String(id)]) || defaultRating;
	}
	const avgRight = sumRight / (rightParticipantIds.length || 1);

	const { newRatingA, newRatingB } = calculatePairEloUpdate({
		leftRating: avgLeft,
		rightRating: avgRight,
		outcome: winnerSide,
		config,
	});

	const deltaA = newRatingA - avgLeft;
	const deltaB = newRatingB - avgRight;

	for (const id of leftParticipantIds) {
		updatedRatings[String(id)] = Math.round(
			(Number(ratings[String(id)]) || defaultRating) + deltaA,
		);
	}
	for (const id of rightParticipantIds) {
		updatedRatings[String(id)] = Math.round(
			(Number(ratings[String(id)]) || defaultRating) + deltaB,
		);
	}
	return { ratings: updatedRatings };
}

const SAMPLE_ENTRIES: ReadonlyArray<readonly [string, string]> = [
	["Nosferatu", "The immortal feline count with shadowy charm"],
	["Luna", "Graceful and mysterious moonlit tabby"],
	["Miso", "Sweet and playful companion who purrs like an engine"],
	["Pixel", "Tech-savvy, energetic, and clever troublemaker"],
	["Saffron", "Warm and spicy personality with golden fur"],
	["Noodle", "Long, stretchy acrobatic champion"],
	["Ziggy", "Bold and energetic fearless explorer"],
	["Whiskers", "Classic, timeless, and distinguished gentlegato"],
	["Pepper", "Small but mighty whirlwind of energy"],
	["Shadow", "Silent stalker of dust motes and midnight zoomies"],
	["Milo", "Friendly adventurer with curious streak"],
	["Barnaby", "Dignified floof with a heart of gold"],
	["Binx", "The cunning black cat with ancient magical flair"],
	["Cleo", "Regal Egyptian queen who demands undivided devotion"],
	["Oliver", "Gentle soul with a weakness for cozy warm blankets"],
	["Felix", "Lucky charmer who always lands gracefully on all four paws"],
	["Jasper", "Spotted rascal with emerald eyes and mischievous spirit"],
	["Gizmo", "Curious tinkerer fascinated by crinkly paper bags"],
	["Salem", "Snarky, articulate familiar with an exquisite taste for drama"],
	["Poppy", "Bouncy, cheerful calico bringing sunshine to every room"],
	["Willow", "Serene and poetic spirit who naps exclusively in sunbeams"],
	["Archie", "Dapper ginger dynamo brimming with unending charisma"],
	["Thor", "Thunderous purr machine with mighty pouncing power"],
	["Loki", "Master of trickery and midnight sock burglary"],
	["Simon", "Talkative companion who always gets the very last word"],
	["Casper", "Friendly white phantom who glides silently through hallways"],
	["Bandit", "Masked sweetheart who steals hearts and hair ties"],
	["Marmalade", "Sun-ripened orange tabby packed with pure sweetness"],
	["Zelda", "Princess of the castle with a courageous adventurous spirit"],
	["Cosmo", "Dreamy space cadet gazing thoughtfully at the stars"],
	["Clover", "Lucky four-leaf feline spreading peace and good fortune"],
	["Hazel", "Gentle observer with warm amber eyes and headbutts"],
	[" Vlad", "Aristocratic night owl who prefers velvet cushions"],
	["Nyx", "Goddess of the night wrapped in sleek obsidian fur"],
	["Mochi", "Soft, squishy cloud who melts into every lap"],
	["Bramble", "Wild-whiskered woodland scout with boundless curiosity"],
	["Onyx", "Polished gemstone panther with hypnotic golden gaze"],
	["Figaro", "Operatic tuxedo virtuoso who sings for breakfast"],
	["Truffle", "Rare gourmet sweetheart with a nose for treats"],
	["Phantom", "Elusive hallway sprinter vanishing in a blink"],
	["chai", "Spiced and soothing cuddle bug for rainy afternoons"],
	["Orion", "Celestial hunter of laser dots and feather wands"],
	["Vesper", "Evening star who awakens just as dusk settles in"],
	["Poe", "Brooding literary genius perched atop the bookshelf"],
	["Kiki", "High-flying witch's apprentice with a chirpy meow"],
	["Biscuit", "Tireless baker of the fluffiest blanket biscuits"],
	["Zephyr", "Gentle west wind who races through open curtains"],
	["Mortimer", "Old-world butler inspecting every cardboard box"],
	["Juniper", "Crisp evergreen climber who rules the highest perch"],
	["Gomez", "Hopeless romantic with a dapper pencil mustache"],
	["Morticia", "Statuesque gothic beauty with an enchanting purr"],
	["Waffles", "Golden-brown breakfast royalty drizzled in charm"],
	["raven", "Glossy midnight watcher who collects shiny trinkets"],
	["Taro", "Sweet violet daydreamer with velvety paws"],
	["Oberon", "King of the fairy forest with majestic ear tufts"],
	["Titania", "Enchanted twilight queen who dances after dark"],
	["Wasabi", "Fiery little green-eyed spice ball with attitude"],
	["Cinder", "Warm fireplace companion dusted in smoky gray"],
	["linus", "Devoted blanket philosopher with a soothing purr"],
	["Astrid", "Starlit Nordic shieldmaiden who fears no vacuum"],
	["gargoyle", "Stoic windowsill guardian watching over the street"],
	["Matcha", "Zen master of the afternoon catnap ritual"],
	["Dracula", "Dramatic cape-wearing count of the laundry pile"],
	["Persephone", "Springtime blossom who rules the underworld sofa"],
	["Hades", "Misunderstood lord of the shadowy under-bed realm"],
	["Sesame", "Tiny seed of chaos with irresistible toe beans"],
	["Fable", "Storybook legend whispered about by neighborhood birds"],
	["Tarot", "Mystic fortune teller who knows when dinner is near"],
	["Rune", "Ancient symbol of cozy mystery and quiet wisdom"],
	["Sylvester", "Classic tuxedo slapstick star with snow-white paws"],
	["Bagheera", "Sleek jungle mentor who prowls the living room"],
	["Calcifer", "Sparkling hearth fire demon with a warm heart"],
	["Jiji", "Sarcastic black cat companion with oversized ears"],
	["Totoro", "Round forest spirit who gives the best belly hugs"],
	["Nori", "Crispy seaweed snack lover with a glossy coat"],
	["Kimchi", "Tangy, spirited troublemaker full of probiotic pep"],
	["Yuzu", "Bright citrus spark who brightens the gloomiest day"],
	["Dante", "Fearless poet journeying through nine circles of yarn"],
	["Virgil", "Loyal guide through the labyrinth of hallway boxes"],
	["Lilith", "Fiercely independent nocturnal huntress"],
	["Azrael", "Feathered-toy nemesis with an angelic purr"],
	["Gatsby", "Lavish host of 3 AM living room zoomie parties"],
	["Sherlock", "Master detective investigating every closed door"],
	["Watson", "Steadfast sidekick who never misses second breakfast"],
	["Puck", "Merry woodland sprite who hides beneath the rug"],
	["Merlin", "Bearded wizard casting sleep spells on the couch"],
	["Morgana", "Spellbinding sorceress with piercing green eyes"],
	["fresco", "Artistic renaissance soul painted in tortoiseshell"],
	["Tempo", "Rhythmic tail-thumper keeping beat on the floorboards"],
	["Echo", "Chatty shadow who answers every single question"],
	["Nimbus", "Floating raincloud of pure silver-tipped fluff"],
	["Solstice", "Longest-napping champion of the winter season"],
	["Eclipse", "Rare cosmic phenomenon blocking the computer screen"],
	["specter", "Friendly poltergeist knocking pens off the desk"],
	["Velvet", "Plush midnight aristocrat who demands chin scratches"],
	["Obsidian", "Volcanic glass beauty with a razor-sharp pounce"],
	["Alabaster", "Snow-white statue who comes alive at treat time"],
	["Belladonna", "Enchanting nightshade blossom with a hypnotic purr"],
	["Crowley", "Mischievous charmer who saunters into every room"],
	["Aziraphale", "Angelically fluffy bookworm guarding the armchair"],
	["abraxas", "Mystic guardian of the top kitchen cabinet"],
	["coraline", "Button-eyed explorer of secret living room tunnels"],
	["Lestat", "Theatrical vampire prince who sleeps until sunset"],
	["Claudia", "Tiny fierce royal with an unstoppable pounce"],
	["Barnabas", "Old-fashioned gentleman of the moonlit parlor"],
	["Endora", "Dramatic spellcaster who judges from the bookshelf"],
	["Tabitha", "Sweet little witch with a twitching nose"],
	["Pyewacket", "Legendary familiar who summons snacks on command"],
	["Grimalkin", "Ancient Scottish fireside sage with amber eyes"],
	["Pangur", "White monastic scholar chasing words across the page"],
	["Behemoth", "Larger-than-life literary black cat of the study"],
	["Caligari", "Somnambulist dreamer curled inside the laundry basket"],
];

export const DEFAULT_SAMPLE_NAMES: NameItem[] = (() => {
	const seen = new Set<string>();
	const list: NameItem[] = [];
	for (const [rawName, description] of SAMPLE_ENTRIES) {
		const trimmed = rawName.trim();
		const formattedName = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
		const key = formattedName.toLowerCase();
		if (seen.has(key)) {
			continue;
		}
		seen.add(key);
		list.push({
			id: String(list.length + 1),
			name: formattedName,
			description,
		});
	}
	return list;
})();

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
		result[id] =
			typeof entry === "number"
				? { rating: entry, wins: 0, losses: 0 }
				: {
						rating: typeof entry.rating === "number" ? entry.rating : 1500,
						wins: typeof entry.wins === "number" ? entry.wins : 0,
						losses: typeof entry.losses === "number" ? entry.losses : 0,
					};
	}
	return result;
}

export function isNameHidden(name: NameItem | null | undefined): boolean {
	return Boolean(name && (name.is_hidden === true || name.isHidden === true));
}

export function isNameLocked(name: NameItem | null | undefined): boolean {
	return Boolean(name && (name.locked_in === true || name.lockedIn === true));
}

export function getVisibleNames(names: NameItem[] | null | undefined): NameItem[] {
	return Array.isArray(names) ? names.filter((n) => !isNameHidden(n)) : [];
}

export function getLockedNames(names: NameItem[] | null | undefined): NameItem[] {
	return Array.isArray(names) ? names.filter((n) => isNameLocked(n)) : [];
}

export function getRandomCatImage(
	id: string | number,
	images: readonly string[] = CAT_IMAGES,
	fallbackName?: string,
): string {
	if (!images || images.length === 0) {
		return "";
	}
	const key = `${id}-${fallbackName || ""}`;
	let hash = 0;
	for (let i = 0; i < key.length; i++) {
		hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
	}
	return images[Math.abs(hash) % images.length] ?? images[0] ?? "";
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
	return items
		.map((item) => (item && typeof item === "object" ? item.id : item))
		.filter(Boolean)
		.map(String)
		.sort()
		.join(",");
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
		return () => undefined;
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
		target.classList.add("img-fallback-applied");
		target.src = target.src.includes(localFallback) ? fallbackSrc : localFallback;
	};
	window.addEventListener("error", handleImageError, true);
	return () => window.removeEventListener("error", handleImageError, true);
}

export const ErrorManager = {
	setupGlobalErrorHandling() {
		const handleRejection = (e: PromiseRejectionEvent) => ErrorManager.handleError(e.reason);
		const handleError = (e: ErrorEvent) => ErrorManager.handleError(e.error);
		window.addEventListener("unhandledrejection", handleRejection);
		window.addEventListener("error", handleError);
		const cleanupImg = setupGlobalImageErrorHandler();
		return () => {
			window.removeEventListener("unhandledrejection", handleRejection);
			window.removeEventListener("error", handleError);
			cleanupImg();
		};
	},

	handleError(
		error: unknown,
		context?: string,
		options?: { componentStack?: string | null; isCritical?: boolean },
	): { id: string } {
		const id = `err_${Date.now()}`;
		if (context) {
			console.error(`[${context}] Error:`, error, options);
		} else {
			console.error("Error:", error);
		}
		return { id };
	},
};
