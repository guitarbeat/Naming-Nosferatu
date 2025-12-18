/**
 * @module metricsUtils
 * @description Utility functions for calculating insights, percentiles, and trends from metric data.
 * Provides helpers for making raw metrics more understandable to users.
 */

/**
 * Calculate the percentile rank of a value within a dataset
 * @param value - The value to rank
 * @param allValues - Array of all values to compare against
 * @param higherIsBetter - If true, higher values = higher percentile (default: true)
 * @returns Percentile rank (0-100)
 */
export function calculatePercentile(
  value: number,
  allValues: number[],
  higherIsBetter = true
): number {
  if (!allValues || allValues.length === 0) return 50;

  const validValues = allValues.filter((v) => v != null && !isNaN(v));
  if (validValues.length === 0) return 50;

  const sorted = [...validValues].sort((a, b) => a - b);

  if (higherIsBetter) {
    // For higher-is-better metrics, count how many values are below this value
    const belowCount = sorted.filter((v) => v < value).length;
    return Math.round((belowCount / sorted.length) * 100);
  } else {
    // For lower-is-better metrics, count how many values are above this value
    const aboveCount = sorted.filter((v) => v > value).length;
    return Math.round((aboveCount / sorted.length) * 100);
  }
}
