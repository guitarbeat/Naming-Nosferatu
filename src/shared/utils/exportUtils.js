/**
 * @module exportUtils
 * @description Utility functions for exporting data to various formats.
 */

/**
 * Download a file with the given content
 * @param {Blob} blob - File content as Blob
 * @param {string} fileName - Name of the file to download
 */
function downloadBlob(blob, fileName) {
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
 * @returns {string} Formatted date string
 */
function getDateString() {
  const [date] = new Date().toISOString().split("T");
  return date;
}

/**
 * Escape a value for CSV (handles quotes and special characters)
 * @param {any} value - Value to escape
 * @returns {string} Escaped CSV value
 */
function escapeCSVValue(value) {
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
 * @param {Array} data - Array of objects to convert
 * @param {Array<string>} headers - Column headers
 * @param {Array<string|Function>} fields - Field names or accessor functions
 * @returns {string} CSV content
 */
export function arrayToCSV(data, headers, fields) {
  if (!data || data.length === 0) return "";

  const headerRow = headers.map(escapeCSVValue).join(",");

  const dataRows = data.map((item) =>
    fields
      .map((field) => {
        const value = typeof field === "function" ? field(item) : item[field];
        return escapeCSVValue(value);
      })
      .join(","),
  );

  return [headerRow, ...dataRows].join("\n");
}

/**
 * Export data to a CSV file and trigger download
 * @param {Array} data - Array of objects to export
 * @param {Object} options - Export options
 * @param {string} options.fileName - Base file name (without extension)
 * @param {Array<string>} options.headers - Column headers
 * @param {Array<string|Function>} options.fields - Field names or accessor functions
 * @param {boolean} options.includeDate - Whether to include date in filename (default: true)
 */
export function exportToCSV(data, options = {}) {
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
  const effectiveFields = fields.length > 0 ? fields : Object.keys(data[0]);

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
 * @param {Array} names - Array of name objects
 * @param {string} fileName - Base file name
 */
export function exportNamesToCSV(names, fileName = "cat-names-export") {
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
 * @param {Array} names - Array of name objects with ratings
 * @param {string} fileName - Base file name
 */
export function exportTournamentResultsToCSV(
  names,
  fileName = "tournament-results",
) {
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

export default {
  exportToCSV,
  exportNamesToCSV,
  exportTournamentResultsToCSV,
  arrayToCSV,
};
