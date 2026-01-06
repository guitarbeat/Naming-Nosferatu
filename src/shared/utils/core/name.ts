import type { NameItem } from "../../propTypes";

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
	category?: string | null;
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
		return names.filter((name) => !isNameHidden(name));
	}

	switch (visibility) {
		case "hidden":
			return names.filter((name) => isNameHidden(name));
		case "all":
			return names;
		default:
			return names.filter((name) => !isNameHidden(name));
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
		category = null,
		sortBy = "rating",
		sortOrder = "desc",
		visibility = "visible",
		isAdmin = false,
	} = filters;

	if (!names || !Array.isArray(names)) {
		return [];
	}
	let result = filterByVisibility([...names], { visibility, isAdmin });

	if (category) {
		result = result.filter((n) => n.categories?.includes(category));
	}

	if (searchTerm) {
		const term = searchTerm.toLowerCase();
		result = result.filter(
			(n) => n.name?.toLowerCase().includes(term) || n.description?.toLowerCase().includes(term),
		);
	}

	const multiplier = sortOrder === "asc" ? 1 : -1;
	result.sort((a, b) => {
		let comp = 0;
		switch (sortBy) {
			case "rating":
				comp = (a.avg_rating || 1500) - (b.avg_rating || 1500);
				break;
			case "name":
			case "alphabetical":
				comp = (a.name || "").localeCompare(b.name || "");
				break;
			case "created_at":
			case "date":
				comp = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
				break;
			default:
				comp = 0;
		}
		return comp * multiplier;
	});

	return result;
}
