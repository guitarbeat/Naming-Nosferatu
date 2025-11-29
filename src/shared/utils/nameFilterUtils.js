/**
 * @module nameFilterUtils
 * @description Simplified name filtering utilities.
 * Single source of truth: names are either visible or hidden.
 */

/**
 * Check if a name is hidden
 * @param {Object} name - Name object
 * @returns {boolean} True if hidden
 */
export function isNameHidden(name) {
  return name?.is_hidden === true || name?.isHidden === true;
}

/**
 * Filter names based on visibility
 * @param {Array} names - Array of name objects
 * @param {Object} options - Filter options
 * @param {string} options.visibility - "visible" | "hidden" | "all"
 * @param {boolean} options.isAdmin - Whether user is admin (admins can see hidden)
 * @returns {Array} Filtered names
 */
export function filterByVisibility(names, { visibility = "visible", isAdmin = false } = {}) {
  if (!Array.isArray(names)) return [];
  
  // Non-admins always see only visible names
  if (!isAdmin) {
    return names.filter(name => !isNameHidden(name));
  }
  
  // Admins can filter by visibility
  switch (visibility) {
    case "hidden":
      return names.filter(name => isNameHidden(name));
    case "all":
      return names;
    case "visible":
    default:
      return names.filter(name => !isNameHidden(name));
  }
}

/**
 * Apply all filters to names
 * @param {Array} names - Array of name objects
 * @param {Object} filters - Filter configuration
 * @param {string} filters.searchTerm - Search text
 * @param {string} filters.category - Category filter
 * @param {string} filters.sortBy - Sort method
 * @param {string} filters.visibility - "visible" | "hidden" | "all"
 * @param {boolean} filters.isAdmin - Admin status
 * @returns {Array} Filtered and sorted names
 */
export function applyNameFilters(names, filters = {}) {
  const {
    searchTerm = "",
    category = null,
    sortBy = "alphabetical",
    visibility = "visible",
    isAdmin = false,
  } = filters;

  let result = [...names];

  // 1. Filter by visibility (most important - single source of truth)
  result = filterByVisibility(result, { visibility, isAdmin });

  // 2. Filter by category
  if (category) {
    result = result.filter(
      name => name.categories && name.categories.includes(category)
    );
  }

  // 3. Filter by search term
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    result = result.filter(name =>
      (name.name && name.name.toLowerCase().includes(term)) ||
      (name.description && name.description.toLowerCase().includes(term))
    );
  }

  // 4. Sort
  result.sort((a, b) => {
    switch (sortBy) {
      case "rating":
        return (b.avg_rating || 1500) - (a.avg_rating || 1500);
      case "popularity":
        return (b.popularity_score || 0) - (a.popularity_score || 0);
      case "alphabetical":
      default:
        return (a.name || "").localeCompare(b.name || "");
    }
  });

  return result;
}

/**
 * Get visibility stats for a list of names
 * @param {Array} names - Array of name objects
 * @returns {Object} Stats object
 */
export function getVisibilityStats(names) {
  if (!Array.isArray(names)) return { total: 0, visible: 0, hidden: 0 };
  
  const hidden = names.filter(isNameHidden).length;
  return {
    total: names.length,
    visible: names.length - hidden,
    hidden,
  };
}
