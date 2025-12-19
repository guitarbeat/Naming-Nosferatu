/**
 * @module metricsUtils
 * @description Utility functions for calculating insights, percentiles, and trends from metric data.
 * Provides helpers for making raw metrics more understandable to users.
 */

interface InsightCategory {
  label: string;
  description: string;
  icon: string;
  color: string;
}

/**
 * Insight categories for badges and highlights
 */
export const INSIGHT_CATEGORIES: Record<string, InsightCategory> = {
  top_rated: {
    label: "Top Rated",
    description: "In the top 10% by rating",
    icon: "⭐",
    color: "var(--color-gold, #f59e0b)",
  },

  trending_up: {
    label: "Trending Up",
    description: "Gaining popularity",
    icon: "📈",
    color: "var(--color-success, #22c55e)",
  },

  trending_down: {
    label: "Trending Down",
    description: "Losing popularity",
    icon: "📉",
    color: "var(--color-danger, #ef4444)",
  },

  most_selected: {
    label: "Most Selected",
    description: "One of the top selections",
    icon: "👍",
    color: "var(--color-info, #3b82f6)",
  },

  underrated: {
    label: "Underrated",
    description: "Good rating but low selections",
    icon: "💎",
    color: "var(--color-purple, #a855f7)",
  },

  new: {
    label: "New",
    description: "Recently added",
    icon: "✨",
    color: "var(--color-cyan, #06b6d4)",
  },

  undefeated: {
    label: "Undefeated",
    description: "No losses yet",
    icon: "🏆",
    color: "var(--color-gold, #f59e0b)",
  },

  undiscovered: {
    label: "Undiscovered",
    description: "Never selected yet",
    icon: "🔍",
    color: "var(--color-subtle, #6b7280)",
  },
};

/**
 * Get insight category definition
 * @param {string} categoryKey - The category key
 * @returns {InsightCategory|null} Category definition or null
 */
export function getInsightCategory(
  categoryKey: string,
): InsightCategory | null {
  return INSIGHT_CATEGORIES[categoryKey] || null;
}

export const METRIC_LABELS: Record<string, string> = {
  rating: "Rating",
  total_wins: "Wins",
  selected: "Selected",
  avg_rating: "Avg Rating",
  wins: "Wins",
  dateSubmitted: "Date Added",
};

/**
 * Get display label for a metric
 * @param {string} metricKey - The metric key
 * @returns {string} Display label
 */
export function getMetricLabel(metricKey: string): string {
  return METRIC_LABELS[metricKey] || metricKey;
}

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

// ============================================================================
// Rating Transformation Utilities (from ratingUtils.ts)
// ============================================================================

interface RatingData {
  rating: number;
  wins: number;
  losses: number;
}

interface RatingItem extends RatingData {
  name: string;
}

interface RatingDataInput {
  rating: number;
  wins?: number;
  losses?: number;
}

/**
 * Converts ratings from object format to array format for API/database operations
 * @param {Record<string, RatingDataInput | number> | RatingItem[]} ratings - Ratings in object format {name: {rating, wins, losses}} or array format
 * @returns {RatingItem[]} Ratings array [{name, rating, wins, losses}, ...]
 */
export function ratingsToArray(
  ratings: Record<string, RatingDataInput | number> | RatingItem[],
): RatingItem[] {
  if (Array.isArray(ratings)) {
    return ratings;
  }

  // Convert object {name: {rating, wins, losses}, ...} to array
  return Object.entries(ratings).map(([name, data]) => ({
    name,
    rating:
      typeof data === "number"
        ? data
        : (data as RatingDataInput)?.rating || 1500,
    wins: typeof data === "object" ? (data as RatingDataInput)?.wins || 0 : 0,
    losses:
      typeof data === "object" ? (data as RatingDataInput)?.losses || 0 : 0,
  }));
}

/**
 * Converts ratings from array format to object format for store/state
 * @param {RatingItem[]} ratingsArray - Ratings array [{name, rating, wins, losses}, ...]
 * @returns {Record<string, RatingData>} Ratings object {name: {rating, wins, losses}, ...}
 */
export function ratingsToObject(
  ratingsArray: RatingItem[],
): Record<string, RatingData> {
  if (!Array.isArray(ratingsArray)) {
    return {};
  }

  return ratingsArray.reduce(
    (acc, item) => {
      acc[item.name] = {
        rating: item.rating || 1500,
        wins: item.wins || 0,
        losses: item.losses || 0,
      };
      return acc;
    },
    {} as Record<string, RatingData>,
  );
}

