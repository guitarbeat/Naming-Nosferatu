/**
 * @module useProfileHighlights
 * @description Custom hook for calculating profile highlights.
 */

import { useState, useEffect } from "react";
import { isEmptyOrNotArray, topN, sortByDate } from "../../../shared/utils/arrayUtils";
import { formatDate } from "../../../shared/utils/timeUtils";

/**
 * Helper to transform items to chart format
 * @param {Array} items - Items to transform
 * @param {string|Function} valueKey - Key or getter for the value
 * @param {Function} valueTransform - Optional transform for the value
 * @returns {Array} Transformed items
 */
const toChartFormat = (items, valueKey, valueTransform = (v) => v) => {
  const getValue = typeof valueKey === "function" ? valueKey : (n) => n[valueKey] || 0;
  return items.map((n) => ({
    id: n.id,
    name: n.name,
    value: valueTransform(getValue(n)),
  }));
};

/**
 * * Hook for calculating profile highlights
 * @param {Array} allNames - Array of all names
 * @returns {Object} Highlights state including topRated, mostWins, mostSelected, recent
 */
export function useProfileHighlights(allNames) {
  const [highlights, setHighlights] = useState({
    topRated: [],
    mostWins: [],
    mostSelected: [],
    recent: [],
  });

  // * Compute highlights whenever names change
  useEffect(() => {
    if (isEmptyOrNotArray(allNames)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHighlights({ topRated: [], mostWins: [], mostSelected: [], recent: [] });
      return;
    }

    // Top rated names
    const withRatings = allNames.filter(
      (n) => typeof n.user_rating === "number" && n.user_rating !== null,
    );
    const topRated = toChartFormat(
      topN(withRatings, "user_rating", 5),
      "user_rating",
      Math.round
    );

    // Most wins
    const withWins = allNames.filter((n) => (n.user_wins || 0) > 0);
    const mostWins = toChartFormat(topN(withWins, "user_wins", 5), "user_wins");

    // Most selected for tournaments (global popularity)
    const withSelections = allNames.filter((n) => (n.times_selected || 0) > 0);
    const mostSelected = toChartFormat(topN(withSelections, "times_selected", 5), "times_selected");

    // Recently updated
    const withDates = allNames.filter((n) => n.updated_at);
    const recent = sortByDate(withDates, "updated_at", "desc")
      .slice(0, 5)
      .map((n) => ({
        id: n.id,
        name: n.name,
        value: formatDate(n.updated_at),
      }));

    setHighlights({ topRated, mostWins, mostSelected, recent });
  }, [allNames]);

  return highlights;
}
