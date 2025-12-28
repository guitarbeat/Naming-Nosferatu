/**
 * @module nameUtils
 * @description Consolidated name utilities for selection, generation, and filtering.
 */

// --- Selection Utils ---

interface NameItem {
    id: string | number;
    is_hidden?: boolean;
    isHidden?: boolean;
    name?: string;
    description?: string;
    categories?: string[];
    avg_rating?: number;
    wins?: number;
    losses?: number;
    popularity_score?: number;
    created_at?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
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
    "Captain", "Dr.", "Professor", "Lord", "Lady", "Sir", "Duchess",
    "Count", "Princess", "Chief", "Master", "Agent", "Detective", "Admiral"
];

const FUNNY_ADJECTIVES = [
    "Whiskers", "Purrington", "Meowington", "Pawsome", "Fluffles", "Scratchy",
    "Naptastic", "Furball", "Cattastic", "Pawdorable", "Whiskertron", "Purrfect"
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

interface FilterOptions {
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
    if (filterStatus === "hidden") return "hidden";
    if (filterStatus === "all") return "all";
    return "visible";
}

/**
 * Internal visibility filter
 */
function filterByVisibility(
    names: NameItem[] | null | undefined,
    { visibility = "visible", isAdmin = false }: { visibility?: "visible" | "hidden" | "all"; isAdmin?: boolean } = {},
): NameItem[] {
    if (!Array.isArray(names)) return [];
    if (!isAdmin) return names.filter((name) => !isNameHidden(name));

    switch (visibility) {
        case "hidden": return names.filter((name) => isNameHidden(name));
        case "all": return names;
        case "visible":
        default: return names.filter((name) => !isNameHidden(name));
    }
}

/**
 * Apply all filters to names
 */
export function applyNameFilters(names: NameItem[] | null | undefined, filters: FilterOptions = {}): NameItem[] {
    const {
        searchTerm = "",
        category = null,
        sortBy = "rating",
        sortOrder = "desc",
        visibility = "visible",
        isAdmin = false,
    } = filters;

    if (!names || !Array.isArray(names)) return [];
    let result = filterByVisibility([...names], { visibility, isAdmin });

    if (category) {
        result = result.filter(n => n.categories && n.categories.includes(category));
    }

    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        result = result.filter(n =>
            (n.name && n.name.toLowerCase().includes(term)) ||
            (n.description && n.description.toLowerCase().includes(term))
        );
    }

    const multiplier = sortOrder === "asc" ? 1 : -1;
    result.sort((a, b) => {
        let comp = 0;
        switch (sortBy) {
            case "rating": comp = (a.avg_rating || 1500) - (b.avg_rating || 1500); break;
            case "name":
            case "alphabetical": comp = (a.name || "").localeCompare(b.name || ""); break;
            case "wins": comp = (a.wins || 0) - (b.wins || 0); break;
            case "losses": comp = (a.losses || 0) - (b.losses || 0); break;
            case "winRate": {
                const aW = a.wins || 0, aL = a.losses || 0, bW = b.wins || 0, bL = b.losses || 0;
                comp = (aW + aL > 0 ? aW / (aW + aL) : 0) - (bW + bL > 0 ? bW / (bW + bL) : 0);
                break;
            }
            case "created": comp = (a.created_at ? new Date(a.created_at).getTime() : 0) - (b.created_at ? new Date(b.created_at).getTime() : 0); break;
            case "popularity": comp = (a.popularity_score || 0) - (b.popularity_score || 0); break;
            default: comp = (a.avg_rating || 1500) - (b.avg_rating || 1500);
        }
        return comp * multiplier;
    });

    return result;
}
