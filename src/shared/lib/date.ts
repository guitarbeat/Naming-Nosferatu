/**
 * @module date
 * @description Date formatting and manipulation utilities
 */

/**
 * Format a date with localization support
 */
export function formatDate(
	date: Date | string | number,
	options: Intl.DateTimeFormatOptions = {},
): string {
	const d = new Date(date);
	if (Number.isNaN(d.getTime())) {
		return "Invalid Date";
	}
	return d.toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
		...options,
	});
}
