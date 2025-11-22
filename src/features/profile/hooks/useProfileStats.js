/**
 * @module useProfileStats
 * @description Custom hook for managing profile statistics.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchUserStatsFromDB,
  calculateSelectionStats,
} from "../utils/profileStats";

/**
 * * Hook for managing profile statistics
 * @param {string} activeUser - Active user name
 * @returns {Object} Stats state
 */
export function useProfileStats(activeUser) {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [selectionStats, setSelectionStats] = useState(null);
  const isMountedRef = useRef(true);

  // * Load statistics using database-optimized function
  useEffect(() => {
    isMountedRef.current = true;

    const loadStats = async () => {
      if (!activeUser) {
        setStatsLoading(false);
        return;
      }

      setStatsLoading(true);

      try {
        // Try database-optimized stats first
        const dbStats = await fetchUserStatsFromDB(activeUser);

        if (!isMountedRef.current) return;

        if (dbStats) {
          setStats(dbStats);
        } else {
          // Fallback to empty stats if database unavailable
          setStats(null);
        }
      } catch (error) {
        if (!isMountedRef.current) return;

        if (process.env.NODE_ENV === "development") {
          console.error("Error loading profile stats:", error);
        }

        // Set to null on error to show empty state
        setStats(null);
      } finally {
        if (isMountedRef.current) {
          setStatsLoading(false);
        }
      }
    };

    void loadStats();

    return () => {
      isMountedRef.current = false;
    };
  }, [activeUser]);

  // * Fetch selection statistics
  const fetchSelectionStats = useCallback(
    async (targetUser = activeUser) => {
      const userToLoad = targetUser ?? activeUser;
      if (!userToLoad) return;

      try {
        const stats = await calculateSelectionStats(userToLoad);

        if (!isMountedRef.current) return;

        setSelectionStats(stats);
      } catch (error) {
        if (!isMountedRef.current) return;
        if (process.env.NODE_ENV === "development") {
          console.error("Error fetching selection stats:", error);
        }
        setSelectionStats(null);
      }
    },
    [activeUser],
  );

  useEffect(() => {
    if (activeUser) {

      fetchSelectionStats(activeUser);
    }
  }, [activeUser, fetchSelectionStats]);

  return {
    stats,
    statsLoading,
    selectionStats,
    fetchSelectionStats,
  };
}
