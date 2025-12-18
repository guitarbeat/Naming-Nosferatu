/**
 * @module nameFilterUtils
 * @description Simplified name filtering utilities.
 * Single source of truth: names are either visible or hidden.
 */

interface NameItem {
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
  [key: string]: unknown;
}

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
 * @param {Object} name - Name object
 * @returns {boolean} True if hidden
 */
export function isNameHidden(name: NameItem | null | undefined): boolean {
  return name?.is_hidden === true || name?.isHidden === true;
}

/**
 * Filter array of names to only visible ones
 * @param {Array} names - Array of name objects
 * @returns {Array} Filtered array of visible names
 */
export function getVisibleNames(names: NameItem[] | null | undefined): NameItem[] {
  if (!Array.isArray(names)) return [];
  return names.filter((name) => !isNameHidden(name));
}

/**
 * Map filterStatus to visibility string
 * @param {string} filterStatus - Filter status ("hidden" | "all" | "visible")
 * @returns {string} Visibility string ("hidden" | "all" | "visible")
 */
export function mapFilterStatusToVisibility(filterStatus: string): "hidden" | "all" | "visible" {
  if (filterStatus === "hidden") return "hidden";
  if (filterStatus === "all") return "all";
  return "visible"; // Default to visible
}

/**
 * Filter names based on visibility
 * @param {Array} names - Array of name objects
 * @param {Object} options - Filter options
 * @param {string} options.visibility - "visible" | "hidden" | "all"
 * @param {boolean} options.isAdmin - Whether user is admin (admins can see hidden)
 * @returns {Array} Filtered names
 */
function filterByVisibility(
  names: NameItem[] | null | undefined,
  { visibility = "visible", isAdmin = false }: { visibility?: "visible" | "hidden" | "all"; isAdmin?: boolean } = {},
): NameItem[] {
  if (!Array.isArray(names)) return [];

  // Non-admins always see only visible names
  if (!isAdmin) {
    return names.filter((name) => !isNameHidden(name));
  }

  // Admins can filter by visibility
  switch (visibility) {
    case "hidden":
      return names.filter((name) => isNameHidden(name));
    case "all":
      return names;
    case "visible":
    default:
      return names.filter((name) => !isNameHidden(name));
  }
}

/**
 * Apply all filters to names
 * @param {Array} names - Array of name objects
 * @param {Object} filters - Filter configuration
 * @param {string} filters.searchTerm - Search text
 * @param {string} filters.category - Category filter
 * @param {string} filters.sortBy - Sort method (rating, name, wins, losses, winRate, created, alphabetical)
 * @param {string} filters.sortOrder - Sort order (asc, desc)
 * @param {string} filters.visibility - "visible" | "hidden" | "all"
 * @param {boolean} filters.isAdmin - Admin status
 * @returns {Array} Filtered and sorted names
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

  if (!names || !Array.isArray(names)) {
    return [];
  }
  let result = [...names];

  // 1. Filter by visibility (most important - single source of truth)
  result = filterByVisibility(result, { visibility, isAdmin });

  // 2. Filter by category
  if (category) {
    result = result.filter(
      (name) => name.categories && name.categories.includes(category),
    );
  }

  // 3. Filter by search term
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    result = result.filter(
      (name) =>
        (name.name && name.name.toLowerCase().includes(term)) ||
        (name.description && name.description.toLowerCase().includes(term)),
    );
  }

  // 4. Sort with direction support
  const isAsc = sortOrder === "asc";
  const multiplier = isAsc ? 1 : -1;

  result.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "rating":
        comparison = (a.avg_rating || 1500) - (b.avg_rating || 1500);
        break;
      case "name":
      case "alphabetical":
        comparison = (a.name || "").localeCompare(b.name || "");
        break;
      case "wins":
        comparison = (a.wins || 0) - (b.wins || 0);
        break;
      case "losses":
        comparison = (a.losses || 0) - (b.losses || 0);
        break;
      case "winRate": {
        const aWinRate =
          a.wins && a.wins + a.losses > 0 ? a.wins / (a.wins + a.losses) : 0;
        const bWinRate =
          b.wins && b.wins + b.losses > 0 ? b.wins / (b.wins + b.losses) : 0;
        comparison = aWinRate - bWinRate;
        break;
      }
      case "created": {
        const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
        comparison = aDate - bDate;
        break;
      }
      case "popularity":
        comparison = (a.popularity_score || 0) - (b.popularity_score || 0);
        break;
      default:
        comparison = (a.avg_rating || 1500) - (b.avg_rating || 1500);
    }

    return comparison * multiplier;
  });

  return result;
}
