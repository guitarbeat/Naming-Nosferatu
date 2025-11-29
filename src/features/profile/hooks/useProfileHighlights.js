/**
 * @module useProfileHighlights
 * @description Custom hook for calculating profile highlights.
 */

import { useState, useEffect } from "react";

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
    if (!Array.isArray(allNames) || allNames.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHighlights({ topRated: [], mostWins: [], mostSelected: [], recent: [] });
      return;
    }

    const withRatings = allNames.filter(
      (n) => typeof n.user_rating === "number" && n.user_rating !== null,
    );
    const topRated = [...withRatings]
      .sort((a, b) => (b.user_rating || 0) - (a.user_rating || 0))
      .slice(0, 5)
      .map((n) => ({
        id: n.id,
        name: n.name,
        value: Math.round(n.user_rating || 0),
      }));

    const mostWins = [...allNames]
      .filter((n) => (n.user_wins || 0) > 0)
      .sort((a, b) => (b.user_wins || 0) - (a.user_wins || 0))
      .slice(0, 5)
      .map((n) => ({ id: n.id, name: n.name, value: n.user_wins || 0 }));

    // Most selected for tournaments (global popularity)
    const mostSelected = [...allNames]
      .filter((n) => (n.times_selected || 0) > 0)
      .sort((a, b) => (b.times_selected || 0) - (a.times_selected || 0))
      .slice(0, 5)
      .map((n) => ({ id: n.id, name: n.name, value: n.times_selected || 0 }));

    const recent = [...allNames]
      .filter((n) => n.updated_at)
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, 5)
      .map((n) => ({
        id: n.id,
        name: n.name,
        value: new Date(n.updated_at).toLocaleDateString(),
      }));

    setHighlights({ topRated, mostWins, mostSelected, recent });
  }, [allNames]);

  return highlights;
}
