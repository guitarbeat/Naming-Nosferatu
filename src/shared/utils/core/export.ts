import type { NameItem } from "../../../types/components";

/**
 * Export data structure - snake_case fields match database column names
 */
export interface ExportNameItem {
	name: string;
	description?: string;
	// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
	user_rating?: number;
	// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
	avg_rating?: number;
	rating?: number;
	// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
	user_wins?: number;
	wins?: number;
	// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
	user_losses?: number;
	losses?: number;
	matches?: number;
	isHidden?: boolean;
}

export type FieldAccessor<T> = keyof T | ((item: T, index: number) => unknown);

export interface ExportOptions<T> {
	fileName?: string;
	headers?: string[];
	fields?: FieldAccessor<T>[];
	includeDate?: boolean;
}

function downloadBlob(blob: Blob, fileName: string): void {
	const url = window.URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.setAttribute("download", fileName);
	document.body.appendChild(link);
	link.click();
	link.parentNode?.removeChild(link);
	window.URL.revokeObjectURL(url);
}

function getDateString(): string {
	return new Date().toISOString().split("T")[0] || "";
}

function escapeCSVValue(value: unknown): string {
	const stringValue = String(value ?? "");
	if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
		return `"${stringValue.replace(/"/g, '""')}"`;
	}
	return stringValue;
}

function arrayToCSV<T>(data: T[], headers: string[], fields: FieldAccessor<T>[]): string {
	const rows = data.map((item, index) =>
		fields
			.map((field) => {
				const value = typeof field === "function" ? field(item, index) : item[field];
				return escapeCSVValue(value);
			})
			.join(","),
	);

	return [headers.join(","), ...rows].join("\n");
}

export function exportToCSV<T>(data: T[], options: ExportOptions<T> = {}): boolean {
	const { fileName = "export", headers = [], fields = [], includeDate = true } = options;

	try {
		const csvContent = arrayToCSV(data, headers, fields);
		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

		const finalFileName = includeDate ? `${fileName}-${getDateString()}.csv` : `${fileName}.csv`;

		downloadBlob(blob, finalFileName);
		return true;
	} catch (error) {
		console.error("Export to CSV failed:", error);
		return false;
	}
}

export function exportNamesToCSV(names: ExportNameItem[], fileName = "cat-names-export"): boolean {
	return exportToCSV(names, {
		fileName,
		headers: ["Name", "Description", "Rating", "Wins", "Losses"],
		fields: [
			"name",
			(n) => n.description || "",
			(n) => n.avg_rating || n.rating || 0,
			(n) => n.wins || n.user_wins || 0,
			(n) => n.losses || n.user_losses || 0,
		],
	});
}

export type NameId = string | number;

// * Extract name IDs from selected names value
export function extractNameIds(
	selectedNamesValue: string[] | NameItem[] | Set<string | number>,
): NameId[] {
	if (selectedNamesValue instanceof Set) {
		return Array.from(selectedNamesValue);
	}

	if (Array.isArray(selectedNamesValue)) {
		if (selectedNamesValue.length === 0) {
			return [];
		}

		const first = selectedNamesValue[0];
		if (typeof first === "string" || typeof first === "number") {
			return selectedNamesValue as NameId[];
		}

		if (typeof first === "object" && first !== null && "id" in first) {
			return (selectedNamesValue as NameItem[]).map((n) => n.id);
		}
	}

	return [];
}

// * Filter out hidden names
export function getVisibleNames(names: NameItem[]): NameItem[] {
	return names.filter((n) => !n.isHidden && !n.is_hidden);
}

export function exportTournamentResultsToCSV(
	names: NameItem[] | ExportNameItem[],
	fileName = "tournament-results",
): boolean {
	// Convert NameItem[] to ExportNameItem[] format if needed
	const exportData: ExportNameItem[] = names.map((n) => {
		if ("avg_rating" in n || "user_rating" in n || "user_wins" in n) {
			// Already in ExportNameItem format
			return n as ExportNameItem;
		}
		// Convert from NameItem to ExportNameItem format
		const nameItem = n as NameItem;
		return {
			name: nameItem.name,
			rating: nameItem.rating || 0,
			// biome-ignore lint/style/useNamingConvention: Database field name must match exactly
			avg_rating: nameItem.avg_rating || nameItem.rating || 0,
			wins: nameItem.wins || 0,
			losses: nameItem.losses || 0,
		} as ExportNameItem;
	});

	return exportToCSV(exportData, {
		fileName,
		headers: ["Rank", "Name", "Rating", "Matches"],
		fields: [
			(_n, index) => (index ? index + 1 : 1),
			"name",
			(n) => Math.round(n.avg_rating || n.rating || 0),
			(n) => (n.wins || 0) + (n.losses || 0),
		],
	});
}
