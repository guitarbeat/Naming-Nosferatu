import { CAT_IMAGES } from "@/config";
import type { NameItem } from "@/types/components";

/**
 * Get a deterministic random cat image based on ID
 */
export function getRandomCatImage(id: string | number | null | undefined, images = CAT_IMAGES) {
	if (!id) return images[0];
	const seed = typeof id === "string" ? id.length : Number(id);
	return images[seed % images.length];
}

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

// --- Generation Utils ---

const FUNNY_PREFIXES = [
	"Captain",
	"Dr.",
	"Professor",
	"Lord",
	"Lady",
	"Sir",
	"Duchess",
	"Count",
	"Princess",
	"Chief",
	"Master",
	"Agent",
	"Detective",
	"Admiral",
];

const FUNNY_ADJECTIVES = [
	"Whiskers",
	"Purrington",
	"Meowington",
	"Pawsome",
	"Fluffles",
	"Scratchy",
	"Naptastic",
	"Furball",
	"Cattastic",
	"Pawdorable",
	"Whiskertron",
	"Purrfect",
	"Fluffy",
];

/**
 * Sanitize a generated name to remove invalid characters
 */
function sanitizeGeneratedName(value: string) {
	return value
		.replace(/[^a-zA-Z0-9 _-]/g, "")
		.replace(/\s+/g, " ")
		.trim();
}

/**
 * Generate a fun random name
 */
export function generateFunName() {
	let attempts = 0;
	let generatedName = "";

	while (!generatedName && attempts < 3) {
		const prefix = FUNNY_PREFIXES[Math.floor(Math.random() * FUNNY_PREFIXES.length)];
		const adjective = FUNNY_ADJECTIVES[Math.floor(Math.random() * FUNNY_ADJECTIVES.length)];

		generatedName = sanitizeGeneratedName(`${prefix} ${adjective}`);
		attempts += 1;
	}

	return generatedName || "Cat Judge";
}

// --- Filter Utils ---

export interface FilterOptions {
	searchTerm?: string;

	sortBy?: string;
	sortOrder?: "asc" | "desc";
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
 * Apply all filters to names
 */
export function applyNameFilters(
	names: NameItem[] | null | undefined,
	filters: FilterOptions = {},
): NameItem[] {
	const {
		searchTerm = "",

		sortBy = "rating",
		sortOrder = "desc",
		visibility = "visible",
		isAdmin = false,
	} = filters;

	if (!names || !Array.isArray(names)) {
		return [];
	}
	let result = filterByVisibility([...names], { visibility, isAdmin });

	if (searchTerm) {
		const term = searchTerm.toLowerCase();
		result = result.filter(
			(n) => n.name?.toLowerCase().includes(term) || n.description?.toLowerCase().includes(term),
		);
	}

	const multiplier = sortOrder === "asc" ? 1 : -1;
	result.sort((a, b) => {
		let comp = 0;
		const valA = a.avgRating ?? a.avg_rating ?? 1500;
		const valB = b.avgRating ?? b.avg_rating ?? 1500;

		switch (sortBy) {
			case "rating":
				comp = valA - valB;
				break;
			case "name":
			case "alphabetical":
				comp = (a.name || "").localeCompare(b.name || "");
				break;
			case "created_at":
			case "date": {
				const dateA = new Date((a.created_at as string) || (a.addedAt as string) || 0).getTime();
				const dateB = new Date((b.created_at as string) || (b.addedAt as string) || 0).getTime();
				comp = dateA - dateB;
				break;
			}
			default:
				comp = 0;
		}
		return comp * multiplier;
	});

	return result;
}
