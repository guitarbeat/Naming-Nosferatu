/**
 * @module useProfileStats
 * @description Custom hook for managing profile statistics.
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchUserStatsFromDB, calculateSelectionStats } from '../utils/profileStats';

/**
 * * Hook for managing profile statistics
 * @param {string} activeUser - Active user name
 * @returns {Object} Stats state
 */
export function useProfileStats(activeUser) {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [selectionStats, setSelectionStats] = useState(null);

  // * Load statistics using database-optimized function
  useEffect(() => {
    const loadStats = async () => {
      if (!activeUser) return;

      setStatsLoading(true);

      // Try database-optimized stats first
      const dbStats = await fetchUserStatsFromDB(activeUser);
      if (dbStats) {
        setStats(dbStats);
      } else {
        // Fallback to empty stats if database unavailable
        setStats(null);
      }

      setStatsLoading(false);
    };

    void loadStats();
  }, [activeUser]);

  // * Fetch selection statistics
  const fetchSelectionStats = useCallback(
    async (targetUser = activeUser) => {
      const userToLoad = targetUser ?? activeUser;
      if (!userToLoad) return;

      try {
        const stats = await calculateSelectionStats(userToLoad);
        setSelectionStats(stats);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching selection stats:', error);
        }
        setSelectionStats(null);
      }
    },
    [activeUser]
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
    fetchSelectionStats
  };
}

