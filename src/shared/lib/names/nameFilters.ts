import type { NameItem } from "@/shared/types";

/**
 * Checks if a name item is hidden.
 */
export function isNameHidden(name: NameItem | null | undefined): boolean {
	return name?.is_hidden === true || name?.isHidden === true;
}

/**
 * Checks if a name item is locked in.
 */
export function isNameLocked(name: NameItem | null | undefined): boolean {
	return name?.locked_in === true || name?.lockedIn === true;
}

/**
 * Checks if a name item is active (neither hidden nor locked).
 */
export function isNameActive(name: NameItem | null | undefined): boolean {
	if (!name) {
		return false;
	}
	return !isNameHidden(name) && !isNameLocked(name);
}

/**
 * Filters a list of names to only those that are not hidden.
 */
export function getVisibleNames(names: NameItem[] | null | undefined): NameItem[] {
	if (!Array.isArray(names)) {
		return [];
	}
	return names.filter((name) => !isNameHidden(name));
}

/**
 * Filters a list of names to only those that are active (neither hidden nor locked).
 */
export function getActiveNames(names: NameItem[] | null | undefined): NameItem[] {
	if (!Array.isArray(names)) {
		return [];
	}
	return names.filter(isNameActive);
}

/**
 * Filters a list of names to only those that are hidden.
 */
export function getHiddenNames(names: NameItem[] | null | undefined): NameItem[] {
	if (!Array.isArray(names)) {
		return [];
	}
	return names.filter(isNameHidden);
}

/**
 * Filters a list of names to only those that are locked in.
 */
export function getLockedNames(names: NameItem[] | null | undefined): NameItem[] {
	if (!Array.isArray(names)) {
		return [];
	}
	return names.filter(isNameLocked);
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
