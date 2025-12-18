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
 * @param {string|null} activeUser - Active user name
 * @returns {Object} Stats state
 */
export function useProfileStats(activeUser: string | null) {
  const [stats, setStats] = useState<{
    avg_rating?: number;
    hidden_count?: number;
    total_losses?: number;
    total_ratings?: number;
    total_wins?: number;
    win_rate?: number;
    names_rated?: number;
    active_ratings?: number;
    hidden_ratings?: number;
    avg_rating_given?: number;
    total_tournaments?: number;
    total_selections?: number;
    unique_users?: number;
    is_aggregate?: boolean;
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [selectionStats, setSelectionStats] = useState<{
    totalSelections: number;
    totalTournaments: number;
    avgSelectionsPerName: number;
    mostSelectedName: string;
    currentStreak: number;
    maxStreak: number;
    userRank: string;
    uniqueUsers: number;
    isAggregate: boolean;
    insights: {
      selectionPattern: string;
      preferredCategories: string;
      improvementTip: string;
    };
    nameSelectionCounts: Record<string, number>;
    nameLastSelected: Record<string, string>;
    nameSelectionFrequency: Record<string, number>;
  } | null>(null);
  const isMountedRef = useRef(true);

  // * Load statistics using database-optimized function
  useEffect(() => {
    isMountedRef.current = true;

    const loadStats = async () => {
      // * If activeUser is null, fetch aggregate stats from all users
      if (activeUser === null) {
        setStatsLoading(true);
        try {
          const aggregateStats = await fetchUserStatsFromDB(null);
          if (!isMountedRef.current) return;
          setStats(aggregateStats);
        } catch (error) {
          if (!isMountedRef.current) return;
          if (process.env.NODE_ENV === "development") {
            console.error("Error loading aggregate stats:", error);
          }
          setStats(null);
        } finally {
          if (isMountedRef.current) {
            setStatsLoading(false);
          }
        }
        return;
      }

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
    // * Fetch selection stats for specific user or aggregate (null = all users)
    if (activeUser !== undefined) {
      fetchSelectionStats(activeUser);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeUser]);

  return {
    stats,
    statsLoading,
    selectionStats,
    fetchSelectionStats,
  };
}
