import type { NameItem, RatingData, RatingInput } from "@/types";

/**
 * Default sample names used as fallback when database is empty or offline.
 */
export const DEFAULT_SAMPLE_NAMES: NameItem[] = [
	{
		id: "1",
		name: "Nosferatu",
		description: "The immortal feline count with shadowy charm",
	},
	{
		id: "2",
		name: "Luna",
		description: "Graceful and mysterious moonlit tabby",
	},
	{
		id: "3",
		name: "Miso",
		description: "Sweet and playful companion who purrs like an engine",
	},
	{
		id: "4",
		name: "Pixel",
		description: "Tech-savvy, energetic, and clever troublemaker",
	},
	{
		id: "5",
		name: "Saffron",
		description: "Warm and spicy personality with golden fur",
	},
	{ id: "6", name: "Noodle", description: "Long, stretchy acrobatic champion" },
	{
		id: "7",
		name: "Ziggy",
		description: "Bold and energetic fearless explorer",
	},
	{
		id: "8",
		name: "Whiskers",
		description: "Classic, timeless, and distinguished gentlegato",
	},
	{
		id: "9",
		name: "Pepper",
		description: "Small but mighty whirlwind of energy",
	},
	{
		id: "10",
		name: "Shadow",
		description: "Silent stalker of dust motes and midnight zoomies",
	},
	{
		id: "11",
		name: "Milo",
		description: "Friendly adventurer with curious streak",
	},
	{
		id: "12",
		name: "Barnaby",
		description: "Dignified floof with a heart of gold",
	},
	{
		id: "13",
		name: "Binx",
		description: "The cunning black cat with ancient magical flair",
	},
	{
		id: "14",
		name: "Cleo",
		description: "Regal Egyptian queen who demands undivided devotion",
	},
	{
		id: "15",
		name: "Oliver",
		description: "Gentle soul with a weakness for cozy warm blankets",
	},
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
	{
		id: "18",
		name: "Gizmo",
		description: "Curious tinkerer fascinated by crinkly paper bags",
	},
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
	{
		id: "22",
		name: "Archie",
		description: "Dapper ginger dynamo brimming with unending charisma",
	},
	{
		id: "23",
		name: "Thor",
		description: "Thunderous purr machine with mighty pouncing power",
	},
	{
		id: "24",
		name: "Loki",
		description: "Master of trickery and midnight sock burglary",
	},
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
	{
		id: "27",
		name: "Bandit",
		description: "Masked sweetheart who steals hearts and hair ties",
	},
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
	{
		id: "30",
		name: "Cosmo",
		description: "Dreamy space cadet gazing thoughtfully at the stars",
	},
	{
		id: "31",
		name: "Clover",
		description: "Lucky four-leaf feline spreading peace and good fortune",
	},
	{
		id: "32",
		name: "Hazel",
		description: "Gentle observer with warm amber eyes and headbutts",
	},
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
	{
		id: "35",
		name: "Tofu",
		description: "Soft, squishy cloud of marshmallow innocence and calm",
	},
	{
		id: "36",
		name: "Boba",
		description: "Sweet boba pearl eyes that can melt any human heart",
	},
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
	{
		id: "41",
		name: "Boris",
		description: "Philosophical aristocrat fond of quiet afternoons",
	},
	{
		id: "42",
		name: "Clementine",
		description: "Bright citrus darling with sweet sunny disposition",
	},
	{
		id: "43",
		name: "Gatsby",
		description: "Lavish socialite hosting grand cardboard box soirees",
	},
	{
		id: "44",
		name: "Penelope",
		description: "Sophisticated lady with pristine white paws and whiskers",
	},
	{
		id: "45",
		name: "Goose",
		description: "Silly goose masquerading as a ferocious predator",
	},
	{
		id: "46",
		name: "Basil",
		description: "Fresh aromatic garden companion with a spicy spark",
	},
	{
		id: "47",
		name: "Churro",
		description: "Sweet cinnamon swirl of high-speed zoomie joy",
	},
	{
		id: "48",
		name: "Mochi",
		description: "Stretchy, lovable sweet treat of a dedicated lap cat",
	},
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
	{
		id: "52",
		name: "Nutmeg",
		description: "Autumn-spiced cutie who adores crunchy autumn leaves",
	},
	{
		id: "53",
		name: "Suki",
		description: "Dearest treasure with ninja stealth and swift pounces",
	},
	{
		id: "54",
		name: "Atticus",
		description: "Wise and fair arbiter of household sunny spots",
	},
	{
		id: "55",
		name: "Bluebell",
		description: "Delicate woodland flower with a soothing gentle presence",
	},
	{
		id: "56",
		name: "Rolo",
		description: "Caramel-filled sweetie with a rich and lustrous coat",
	},
];

/**
 * Normalizes a record of ratings (raw numbers or RatingData) to standard RatingData.
 */
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

/**
 * Checks if a name item is hidden.
 */
export function isNameHidden(name: NameItem | null | undefined): boolean {
	return Boolean(name && (name.is_hidden === true || name.isHidden === true));
}

/**
 * Checks if a name item is locked in.
 */
export function isNameLocked(name: NameItem | null | undefined): boolean {
	return Boolean(name && (name.locked_in === true || name.lockedIn === true));
}

/**
 * Checks if a name item is active (neither hidden nor locked).
 */
export function isNameActive(name: NameItem | null | undefined): boolean {
	return Boolean(name && !isNameHidden(name) && !isNameLocked(name));
}

/**
 * Filters a list of names to only those that are not hidden.
 */
export function getVisibleNames(names: NameItem[] | null | undefined): NameItem[] {
	if (!Array.isArray(names)) {
		return [];
	}
	// Salvaged from Jules PR #1518: single-pass filter
	const result: NameItem[] = [];
	for (let i = 0; i < names.length; i++) {
		const name = names[i];
		if (!isNameHidden(name)) {
			result.push(name);
		}
	}
	return result;
}

/**
 * Filters a list of names to only those that are active (neither hidden nor locked).
 */
export function getActiveNames(names: NameItem[] | null | undefined): NameItem[] {
	if (!Array.isArray(names)) {
		return [];
	}
	// Salvaged from Jules PR #1518: single-pass filter
	const result: NameItem[] = [];
	for (let i = 0; i < names.length; i++) {
		const name = names[i];
		if (isNameActive(name)) {
			result.push(name);
		}
	}
	return result;
}

/**
 * Filters a list of names to only those that are hidden.
 */
export function getHiddenNames(names: NameItem[] | null | undefined): NameItem[] {
	if (!Array.isArray(names)) {
		return [];
	}
	// Salvaged from Jules PR #1518: single-pass filter
	const result: NameItem[] = [];
	for (let i = 0; i < names.length; i++) {
		const name = names[i];
		if (isNameHidden(name)) {
			result.push(name);
		}
	}
	return result;
}

/**
 * Filters a list of names to only those that are locked in.
 */
export function getLockedNames(names: NameItem[] | null | undefined): NameItem[] {
	if (!Array.isArray(names)) {
		return [];
	}
	// Salvaged from Jules PR #1518: single-pass filter
	const result: NameItem[] = [];
	for (let i = 0; i < names.length; i++) {
		const name = names[i];
		if (isNameLocked(name)) {
			result.push(name);
		}
	}
	return result;
}

/**
 * Checks if a name matches a search term (by name or description).
 */
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
