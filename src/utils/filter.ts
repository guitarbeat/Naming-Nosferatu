/**
 * @module filter
 * @description Name filtering and visibility utilities
 */

import type { NameItem } from "@/types/appTypes";

export interface FilterOptions {
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
 * Apply visibility filter to names
 */
export function applyNameFilters(
	names: NameItem[] | null | undefined,
	filters: FilterOptions = {},
): NameItem[] {
	const { visibility = "visible", isAdmin = false } = filters;

	if (!names || !Array.isArray(names)) {
		return [];
	}
	return filterByVisibility([...names], { visibility, isAdmin });
}

/**
 * Converts an array of selected names to a Set of IDs for O(1) lookup.
 */
export function selectedNamesToSet(
	selectedNames: NameItem[] | Set<string | number>,
): Set<string | number> {
	if (selectedNames instanceof Set) {
		return selectedNames;
	}
	return new Set(selectedNames.map((n) => n.id));
}
