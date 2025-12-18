/**
 * @module exportUtils
 * @description Utility functions for exporting data to various formats.
 */

interface NameItem {
  name: string;
  description?: string;
  user_rating?: number;
  avg_rating?: number;
  rating?: number;
  user_wins?: number;
  wins?: number;
  user_losses?: number;
  losses?: number;
  matches?: number;
  isHidden?: boolean;
  [key: string]: unknown;
}

type FieldAccessor<T> = string | ((item: T) => unknown);

interface ExportOptions<T> {
  fileName?: string;
  headers?: string[];
  fields?: FieldAccessor<T>[];
  includeDate?: boolean;
}

/**
 * Download a file with the given content
 * @param blob - File content as Blob
 * @param fileName - Name of the file to download
 */
function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get a formatted date string for file names (YYYY-MM-DD)
 * @returns Formatted date string
 */
function getDateString(): string {
  const [date] = new Date().toISOString().split("T");
  return date;
}

/**
 * Escape a value for CSV (handles quotes and special characters)
 * @param value - Value to escape
 * @returns Escaped CSV value
 */
function escapeCSVValue(value: unknown): string {
  if (value == null) return "";
  const str = String(value);
  // If contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert an array of objects to CSV string
 * @param data - Array of objects to convert
 * @param headers - Column headers
 * @param fields - Field names or accessor functions
 * @returns CSV content
 */
function arrayToCSV<T extends Record<string, unknown>>(
  data: T[],
  headers: string[],
  fields: FieldAccessor<T>[]
): string {
  if (!data || data.length === 0) return "";

  const headerRow = headers.map(escapeCSVValue).join(",");

  const dataRows = data.map((item) =>
    fields
      .map((field) => {
        const value = typeof field === "function" ? field(item) : item[field];
        return escapeCSVValue(value);
      })
      .join(",")
  );

  return [headerRow, ...dataRows].join("\n");
}

/**
 * Export data to a CSV file and trigger download
 * @param data - Array of objects to export
 * @param options - Export options
 */
function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  options: ExportOptions<T> = {}
): boolean {
  const {
    fileName = "export",
    headers = [],
    fields = [],
    includeDate = true,
  } = options;

  if (!data || data.length === 0) {
    console.warn("No data to export");
    return false;
  }

  // If no headers/fields provided, auto-generate from first item
  const effectiveHeaders = headers.length > 0 ? headers : Object.keys(data[0]);
  const effectiveFields = fields.length > 0 ? fields : (Object.keys(data[0]) as FieldAccessor<T>[]);

  const csvContent = arrayToCSV(data, effectiveHeaders, effectiveFields);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  const fullFileName = includeDate
    ? `${fileName}_${getDateString()}.csv`
    : `${fileName}.csv`;

  downloadBlob(blob, fullFileName);
  return true;
}

/**
 * Export cat names data to CSV with standard columns
 * @param names - Array of name objects
 * @param fileName - Base file name
 */
export function exportNamesToCSV(names: NameItem[], fileName = "cat-names-export"): boolean {
  return exportToCSV(names, {
    fileName,
    headers: ["Name", "Description", "Rating", "Wins", "Losses", "Hidden"],
    fields: [
      "name",
      "description",
      (item) => item.user_rating || item.avg_rating || 1500,
      (item) => item.user_wins || item.wins || 0,
      (item) => item.user_losses || item.losses || 0,
      (item) => (item.isHidden ? "Yes" : "No"),
    ],
  });
}

/**
 * Export tournament results to CSV
 * @param names - Array of name objects with ratings
 * @param fileName - Base file name
 */
export function exportTournamentResultsToCSV(
  names: NameItem[],
  fileName = "tournament-results"
): boolean {
  return exportToCSV(names, {
    fileName,
    headers: ["Name", "Rating", "Wins", "Losses", "Matches"],
    fields: [
      "name",
      (item) => item.rating || 0,
      (item) => item.wins || 0,
      (item) => item.losses || 0,
      (item) => item.matches || 0,
    ],
  });
}
