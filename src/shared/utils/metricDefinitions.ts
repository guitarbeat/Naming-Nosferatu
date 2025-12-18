/**
 * @module metricDefinitions
 * @description Centralized definitions and explanations for all metrics used in the analysis dashboard.
 * Provides consistent terminology and help text across the app.
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
const INSIGHT_CATEGORIES: Record<string, InsightCategory> = {
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

const METRIC_LABELS: Record<string, string> = {
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
