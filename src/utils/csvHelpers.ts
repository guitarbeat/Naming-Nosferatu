import type { NameItem } from "../types/appTypes";

/**
 * Sanitizes a field for CSV export to prevent formula injection.
 * Prepends a single quote if the field starts with =, +, -, or @.
 * Also handles standard CSV quoting (escaping double quotes).
 */
export function sanitizeCSVField(field: string | number | null | undefined): string {
	if (field === null || field === undefined) {
		return '""';
	}

	const stringValue = String(field);

	// Prevent formula injection
	// https://owasp.org/www-community/attacks/CSV_Injection
	const isDangerous = /^[=+\-@]/.test(stringValue);
	const safeValue = isDangerous ? `'${stringValue}` : stringValue;

	// Escape double quotes by doubling them
	return `"${safeValue.replace(/"/g, '""')}"`;
}

/**
 * Generates a CSV string from a list of NameItems.
 */
export function generateCSV(rankings: NameItem[]): string {
	if (rankings.length === 0) {
		return "";
	}

	const headers = ["Name", "Rating", "Wins", "Losses"];
	const rows = rankings.map((r) =>
		[
			sanitizeCSVField(r.name),
			Math.round(Number(r.rating ?? 1500)),
			r.wins ?? 0,
			r.losses ?? 0,
		].join(","),
	);

	return [headers.join(","), ...rows].join("\n");
}
