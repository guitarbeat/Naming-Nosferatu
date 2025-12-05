/**
 * @module useMetricComparison
 * @description Hook for calculating metric insights, percentiles, and comparisons.
 * Provides memoized calculations to avoid unnecessary recalculations.
 */

import { useMemo } from 'react';
import {
  calculatePercentile,
  determineTrend,
  getInsightMessage,
  getComparisonText,
  calculateStats,
} from '../utils/metricsUtils';

/**
 * Hook to calculate metric comparisons and insights for a single item
 * @param {Object} item - The item with metric values
 * @param {Object[]} allItems - All items for comparison/percentile calculation
 * @param {Object} options - Configuration options
 * @param {string} options.ratingField - Field name for rating metric (default: 'rating' or 'avg_rating')
 * @param {string} options.selectedField - Field name for selection count (default: 'selected' or 'times_selected')
 * @param {string} options.winsField - Field name for wins (default: 'wins' or 'total_wins')
 * @param {string} options.lossesField - Field name for losses (default: 'losses' or 'total_losses')
 * @returns {Object} Metrics with calculated insights
 */
export function useMetricComparison(item, allItems = [], options = {}) {
  const {
    ratingField = item?.rating != null ? 'rating' : 'avg_rating',
    selectedField = item?.selected != null ? 'selected' : 'times_selected',
    winsField = item?.wins != null ? 'wins' : 'total_wins',
    lossesField = item?.losses != null ? 'losses' : 'total_losses',
  } = options;

  return useMemo(() => {
    if (!item) {
      return {
        percentile: 50,
        ratingPercentile: 50,
        selectedPercentile: 50,
        winsPercentile: 50,
        insightMessage: '',
        comparisonText: '',
        trend: { direction: 'stable', percentChange: 0 },
        stats: { avgRating: 1500, avgSelected: 0, avgWins: 0 },
      };
    }

    // Extract metric values
    const rating = item[ratingField] ?? 1500;
    const selected = item[selectedField] ?? 0;
    const wins = item[winsField] ?? 0;
    const losses = item[lossesField] ?? 0;

    // Get all values for percentile calculation
    const allRatings = allItems.map((i) => i[ratingField] ?? 1500);
    const allSelected = allItems.map((i) => i[selectedField] ?? 0);
    const allWins = allItems.map((i) => i[winsField] ?? 0);

    // Calculate percentiles
    const ratingPercentile = calculatePercentile(rating, allRatings, true);
    const selectedPercentile = calculatePercentile(selected, allSelected, true);
    const winsPercentile = calculatePercentile(wins, allWins, true);

    // Overall percentile (average of rating and selected)
    const percentile = Math.round((ratingPercentile + selectedPercentile) / 2);

    // Calculate stats for context
    const stats = {
      avgRating: Math.round(allRatings.reduce((a, b) => a + b, 0) / allRatings.length),
      avgSelected:
        Math.round((allSelected.reduce((a, b) => a + b, 0) / allSelected.length) * 10) / 10,
      avgWins: Math.round((allWins.reduce((a, b) => a + b, 0) / allWins.length) * 10) / 10,
    };

    // Generate insight message
    const insightMessage = getInsightMessage({
      rating,
      selected,
      wins,
      losses,
      percentile,
    });

    // Generate comparison text
    const comparisonText = getComparisonText(rating, stats.avgRating, 'rating');

    // Determine trend (if we have previous data)
    const trend = { direction: 'stable', percentChange: 0 };

    return {
      percentile,
      ratingPercentile,
      selectedPercentile,
      winsPercentile,
      insightMessage,
      comparisonText,
      trend,
      stats,
      metrics: {
        rating,
        selected,
        wins,
        losses,
      },
    };
  }, [item, allItems, ratingField, selectedField, winsField, lossesField]);
}

/**
 * Hook to calculate metrics for multiple items at once
 * Useful for enriching arrays with percentile data
 * @param {Object[]} items - Array of items to process
 * @param {Object} options - Configuration options (same as useMetricComparison)
 * @returns {Object[]} Items enriched with metric insights
 */
export function useMultipleMetricComparison(items = [], options = {}) {
  return useMemo(() => {
    if (!items || items.length === 0) return [];

    return items.map((item) => {
      // Calculate insights for this item
      const insights = useMetricComparison(item, items, options);

      return {
        ...item,
        _insights: insights,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, options]);
}

/**
 * Hook to get summary statistics across all items
 * @param {Object[]} items - Array of items
 * @param {Object} options - Configuration options
 * @returns {Object} Summary statistics
 */
export function useMetricsStatistics(items = [], options = {}) {
  const {
    ratingField = 'rating',
    selectedField = 'selected',
    winsField = 'wins',
  } = options;

  return useMemo(() => {
    if (!items || items.length === 0) {
      return {
        ratings: { min: 0, max: 0, mean: 0, median: 0, stdDev: 0 },
        selected: { min: 0, max: 0, mean: 0, median: 0, stdDev: 0 },
        wins: { min: 0, max: 0, mean: 0, median: 0, stdDev: 0 },
      };
    }

    const ratings = items.map((i) => i[ratingField] ?? 1500);
    const selected = items.map((i) => i[selectedField] ?? 0);
    const wins = items.map((i) => i[winsField] ?? 0);

    return {
      ratings: calculateStats(ratings),
      selected: calculateStats(selected),
      wins: calculateStats(wins),
    };
  }, [items, ratingField, selectedField, winsField]);
}

/**
 * Hook to determine if an item has a specific insight/achievement
 * @param {Object} item - The item to check
 * @param {Object[]} allItems - All items for comparison
 * @param {string} insightType - Type of insight to check (e.g., 'top_rated', 'trending_up', etc.)
 * @param {Object} options - Configuration options
 * @returns {boolean} Whether the item qualifies for this insight
 */
export function useHasInsight(item, allItems = [], insightType, options = {}) {
  const {
    ratingField = 'rating',
    selectedField = 'selected',
    winsField = 'wins',
    lossesField = 'losses',
  } = options;

  return useMemo(() => {
    if (!item || !insightType) return false;

    const rating = item[ratingField] ?? 1500;
    const selected = item[selectedField] ?? 0;
    const wins = item[winsField] ?? 0;
    const losses = item[lossesField] ?? 0;

    const allRatings = allItems.map((i) => i[ratingField] ?? 1500);
    const allSelected = allItems.map((i) => i[selectedField] ?? 0);

    const ratingPercentile = calculatePercentile(rating, allRatings, true);
    const selectedPercentile = calculatePercentile(selected, allSelected, true);

    switch (insightType) {
      case 'top_rated':
        return ratingPercentile >= 90;

      case 'most_selected':
        return selectedPercentile >= 90;

      case 'underrated':
        return ratingPercentile >= 70 && selectedPercentile < 50;

      case 'undefeated':
        return wins > 0 && losses === 0;

      case 'undiscovered':
        return selected === 0;

      case 'new':
        // Check if item has very few selections/ratings
        return selected < 2 && wins + losses < 2;

      default:
        return false;
    }
  }, [item, allItems, insightType, ratingField, selectedField, winsField, lossesField]);
}
