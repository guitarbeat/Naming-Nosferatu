/**
 * @module metricsUtils
 * @description Utility functions for calculating insights, percentiles, and trends from metric data.
 * Provides helpers for making raw metrics more understandable to users.
 */

/**
 * Calculate the percentile rank of a value within a dataset
 * @param {number} value - The value to rank
 * @param {number[]} allValues - Array of all values to compare against
 * @param {boolean} higherIsBetter - If true, higher values = higher percentile (default: true)
 * @returns {number} Percentile rank (0-100)
 */
export function calculatePercentile(value, allValues, higherIsBetter = true) {
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

/**
 * Determine if a metric is trending up, down, or stable
 * @param {number} current - Current metric value
 * @param {number} previous - Previous metric value
 * @param {number} threshold - Minimum percent change to trigger trend (default: 5%)
 * @returns {Object} { direction: 'up' | 'down' | 'stable', percentChange: number }
 */
export function determineTrend(current, previous, threshold = 5) {
  if (current == null || previous == null || previous === 0) {
    return { direction: 'stable', percentChange: 0 };
  }
  
  const percentChange = ((current - previous) / previous) * 100;
  
  if (Math.abs(percentChange) < threshold) {
    return { direction: 'stable', percentChange: 0 };
  }
  
  return {
    direction: percentChange > 0 ? 'up' : 'down',
    percentChange: Math.round(Math.abs(percentChange) * 10) / 10,
  };
}

/**
 * Generate contextual insight message for a name based on its metrics
 * @param {Object} metrics - Metrics object { rating, selected, wins, losses, avgRating, percentile }
 * @returns {string} Insight message
 */
export function getInsightMessage(metrics = {}) {
  const { rating = 1500, selected = 0, wins = 0, losses = 0, percentile = 50 } = metrics;
  
  if (selected === 0) {
    return "Never selected yet";
  }
  
  if (percentile >= 90) {
    return "Top 10% most popular";
  }
  
  if (percentile >= 75) {
    return "Top 25% most popular";
  }
  
  if (wins > 0 && losses === 0) {
    return `Undefeated (${wins} win${wins !== 1 ? 's' : ''})`;
  }
  
  if (rating > 1700) {
    return "Strong contender";
  }
  
  if (selected > 10) {
    return "Popular choice";
  }
  
  return "Emerging name";
}

/**
 * Format a metric name to human-readable format
 * @param {string} metricName - The metric name (e.g., 'avg_rating', 'times_selected')
 * @returns {string} Human-readable name
 */
export function formatMetricLabel(metricName) {
  const labelMap = {
    avg_rating: 'Rating',
    rating: 'Rating',
    times_selected: 'Times Selected',
    selected: 'Selected',
    total_wins: 'Wins',
    wins: 'Wins',
    total_losses: 'Losses',
    losses: 'Losses',
    win_rate: 'Win Rate',
    popularity_score: 'Popularity Score',
    unique_selectors: 'Unique Selectors',
    users_rated: 'Users Rated',
    created_at: 'Created',
    date_submitted: 'Submitted',
  };
  
  return labelMap[metricName] || metricName
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get the CSS color class/variable for a metric based on its value and percentile
 * @param {string} metricName - The metric name
 * @param {number} value - The metric value
 * @param {number} percentile - The percentile rank (0-100)
 * @returns {string} CSS variable or color name
 */
export function getMetricColor(metricName, value = 0, percentile = 50) {
  // Higher percentile = better color
  if (percentile >= 75) {
    return 'var(--color-success, #22c55e)'; // Green
  }
  
  if (percentile >= 50) {
    return 'var(--color-info, #3b82f6)'; // Blue
  }
  
  if (percentile >= 25) {
    return 'var(--color-warning, #f59e0b)'; // Amber
  }
  
  return 'var(--color-subtle, #6b7280)'; // Gray
}

/**
 * Format a rating value with context
 * @param {number} rating - The rating value (Elo-based, typically 1000-3000)
 * @returns {string} Formatted rating with context
 */
export function formatRating(rating = 1500) {
  if (rating < 1200) return `${rating} (Novice)`;
  if (rating < 1400) return `${rating} (Developing)`;
  if (rating < 1600) return `${rating} (Solid)`;
  if (rating < 1800) return `${rating} (Strong)`;
  if (rating < 2000) return `${rating} (Excellent)`;
  return `${rating} (Elite)`;
}

/**
 * Format win rate percentage
 * @param {number} wins - Number of wins
 * @param {number} losses - Number of losses
 * @returns {string} Formatted win rate percentage
 */
export function formatWinRate(wins = 0, losses = 0) {
  if (wins + losses === 0) return 'N/A';
  const rate = (wins / (wins + losses)) * 100;
  return `${Math.round(rate)}%`;
}

/**
 * Get a comparison text for a metric vs average
 * @param {number} value - The value to compare
 * @param {number} average - The average value to compare against
 * @param {string} metricName - The metric name (for context)
 * @returns {string} Comparison text (e.g., "25% above average")
 */
export function getComparisonText(value, average, metricName = 'average') {
  if (average === 0 || value == null) return '';
  
  const diff = ((value - average) / average) * 100;
  const absDiff = Math.round(Math.abs(diff));
  
  if (Math.abs(diff) < 5) {
    return 'at average';
  }
  
  if (diff > 0) {
    return `${absDiff}% above average`;
  }
  
  return `${absDiff}% below average`;
}

/**
 * Rank a collection of items by a specific metric
 * @param {Object[]} items - Array of items with metric values
 * @param {string} metricName - The metric to rank by
 * @param {boolean} descending - If true, highest value = rank 1 (default: true)
 * @returns {Object[]} Items with added rank property
 */
export function rankItems(items, metricName, descending = true) {
  if (!items || items.length === 0) return [];
  
  const sorted = [...items].sort((a, b) => {
    const aVal = a[metricName] ?? 0;
    const bVal = b[metricName] ?? 0;
    return descending ? bVal - aVal : aVal - bVal;
  });
  
  return sorted.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}

/**
 * Calculate summary statistics for an array of values
 * @param {number[]} values - Array of numeric values
 * @returns {Object} Statistics { min, max, mean, median, stdDev }
 */
export function calculateStats(values = []) {
  const validValues = values.filter((v) => v != null && !isNaN(v));
  
  if (validValues.length === 0) {
    return { min: 0, max: 0, mean: 0, median: 0, stdDev: 0 };
  }
  
  const sorted = [...validValues].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const mean = sorted.reduce((a, b) => a + b, 0) / sorted.length;
  const median =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
  
  const variance =
    sorted.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / sorted.length;
  const stdDev = Math.sqrt(variance);
  
  return { min, max, mean, median, stdDev };
}
