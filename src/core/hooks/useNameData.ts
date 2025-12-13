/**
 * @module useNameData
 * @description Unified hook for fetching name data for both Tournament and Profile views.
 * Handles differences in data requirements between modes.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { resolveSupabaseClient } from "../../shared/services/supabase/client";
import {
  getNamesWithDescriptions,
  getNamesWithUserRatings,
} from "../../shared/services/supabase/api";
import { devLog } from "../../shared/utils/coreUtils";
import { ErrorManager } from "../../shared/services/errorManager";
import { FALLBACK_NAMES } from "../../features/tournament/constants";
import { TIMING } from "../../core/constants";

/**
 * Unified hook for fetching name data
 * @param {Object} options
 * @param {string} options.userName - Current user name
 * @param {string} options.mode - Display mode: 'tournament' or 'profile'
 * @param {boolean} options.enableErrorHandling - Whether to use ErrorManager (default: true)
 * @returns {Object} Name data state and handlers
 */
export function useNameData({
  userName,
  mode = "tournament",
  enableErrorHandling = true,
}) {
  const [names, setNames] = useState([]);
  const [hiddenIds, setHiddenIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);
  const timeoutIdsRef = useRef([]);

  // * Helper to create timeout with cleanup tracking
  const createTimeout = useCallback((ms, errorMsg) => {
    let timeoutId = null;
    const promise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(errorMsg)), ms);
      timeoutIdsRef.current.push(timeoutId);
    });
    return { promise, timeoutId };
  }, []);

  // * Clear all timeouts
  const clearAllTimeouts = useCallback(() => {
    timeoutIdsRef.current.forEach((id) => clearTimeout(id));
    timeoutIdsRef.current = [];
  }, []);

  // * Fetch names based on mode
  const fetchNames = useCallback(async () => {
    clearAllTimeouts();

    try {
      setIsLoading(true);
      setError(null);

      // * Get Supabase client with timeout
      let supabaseClient;
      try {
        const { promise: clientTimeout, timeoutId: clientTimeoutId } =
          createTimeout(
            TIMING.SUPABASE_CLIENT_TIMEOUT_MS,
            `Supabase client timeout after ${TIMING.SUPABASE_CLIENT_TIMEOUT_MS / 1000} seconds`,
          );

        supabaseClient = await Promise.race([
          resolveSupabaseClient(),
          clientTimeout,
        ]);

        // * Clear timeout on successful resolution
        if (clientTimeoutId) {
          clearTimeout(clientTimeoutId);
          const index = timeoutIdsRef.current.indexOf(clientTimeoutId);
          if (index > -1) timeoutIdsRef.current.splice(index, 1);
        }
      } catch (timeoutError) {
        clearAllTimeouts();
        if (mode === "tournament") {
          setNames(FALLBACK_NAMES);
        } else {
          setNames([]);
        }
        setIsLoading(false);
        if (enableErrorHandling) {
          ErrorManager.handleError(
            timeoutError,
            `${mode === "tournament" ? "TournamentSetup" : "Profile"} - Supabase Client Timeout`,
            {
              isRetryable: true,
              affectsUserData: false,
              isCritical: false,
            },
          );
        }
        return;
      }

      if (!supabaseClient) {
        clearAllTimeouts();
        if (mode === "tournament") {
          setNames(FALLBACK_NAMES);
        } else {
          setNames([]);
        }
        setIsLoading(false);
        return;
      }

      // * Fetch data based on mode
      let namesData;

      if (mode === "tournament") {
        // Tournament mode: fetch ALL names including hidden (UI will filter based on admin status)
        try {
          const { promise: fetchTimeout, timeoutId: fetchTimeoutId } =
            createTimeout(15000, "Data fetch timeout after 15 seconds");

          // Fetch all names including hidden - UI will handle visibility filtering
          // This allows admins to see and manage hidden names
          const fetchPromise = getNamesWithDescriptions(true); // includeHidden = true

          namesData = await Promise.race([fetchPromise, fetchTimeout]);

          // * Clear timeout on successful resolution
          if (fetchTimeoutId) {
            clearTimeout(fetchTimeoutId);
            const index = timeoutIdsRef.current.indexOf(fetchTimeoutId);
            if (index > -1) timeoutIdsRef.current.splice(index, 1);
          }

          // * Check if we got fallback names (indicates backend issue)
          if (
            Array.isArray(namesData) &&
            namesData.length > 0 &&
            namesData[0]?.description?.includes("temporary fallback")
          ) {
            // Backend returned fallback names - this means Supabase wasn't available
            // Don't treat this as an error, but log it
            if (process.env.NODE_ENV === "development") {
              console.warn(
                "⚠️ Backend returned fallback names - Supabase may not be fully available",
              );
            }
            // Continue with fallback names - they're already in the correct format
          }

          // Hidden data is now included in namesData via is_hidden property
        } catch (timeoutError) {
          clearAllTimeouts();
          // Only use fallback if we truly timed out
          if (timeoutError.message?.includes("timeout")) {
            setNames(FALLBACK_NAMES);
            setIsLoading(false);
            if (enableErrorHandling) {
              ErrorManager.handleError(
                timeoutError,
                "TournamentSetup - Data Fetch Timeout",
                {
                  isRetryable: true,
                  affectsUserData: false,
                  isCritical: false,
                },
              );
            }
            return;
          }
          // Re-throw other errors to be handled by outer catch
          throw timeoutError;
        }
      } else {
        // Profile mode: fetch names with user-specific ratings
        if (!userName) {
          setIsLoading(false);
          return;
        }

        namesData = await getNamesWithUserRatings(userName);

        // Add owner info to names
        namesData = namesData.map((name) => ({
          ...name,
          owner: userName,
        }));
      }

      if (!isMountedRef.current) return;

      // * Safety check: ensure namesData is an array
      if (!Array.isArray(namesData)) {
        throw new Error("Invalid response: namesData is not an array");
      }

      // * Create Set of hidden IDs for O(1) lookup (from is_hidden property)
      const hiddenIdsSet = new Set(
        namesData
          .filter((name) => name.is_hidden === true)
          .map((name) => name.id),
      );

      // * Sort names alphabetically for better UX
      const sortedNames = [...namesData].sort((a, b) =>
        (a?.name || "").localeCompare(b?.name || ""),
      );

      if (process.env.NODE_ENV === "development") {
        devLog(
          `🎮 ${mode === "tournament" ? "TournamentSetup" : "Profile"}: Data loaded`,
          {
            availableNames: sortedNames.length,
            hiddenNames: hiddenIdsSet.size,
            mode,
          },
        );
      }

      setNames(sortedNames);
      setHiddenIds(hiddenIdsSet);
    } catch (err) {
      if (!isMountedRef.current) return;

      clearAllTimeouts();

      // * Provide fallback based on mode
      if (mode === "tournament") {
        setNames(FALLBACK_NAMES);
      } else {
        setNames([]);
      }

      setError(err);

      if (enableErrorHandling) {
        ErrorManager.handleError(
          err,
          `${mode === "tournament" ? "TournamentSetup" : "Profile"} - Fetch Names`,
          {
            isRetryable: true,
            affectsUserData: false,
            isCritical: false,
          },
        );
      }
    } finally {
      if (isMountedRef.current) {
        clearAllTimeouts();
        setIsLoading(false);
      }
    }
  }, [userName, mode, enableErrorHandling, createTimeout, clearAllTimeouts]);

  // * Refetch names
  const refetch = useCallback(() => {
    fetchNames();
  }, [fetchNames]);

  // * Setters for optimistic updates
  const updateNames = useCallback((updater) => {
    if (typeof updater === "function") {
      setNames((prev) => updater(prev));
    } else {
      setNames(updater);
    }
  }, []);

  const updateHiddenIds = useCallback((updater) => {
    if (typeof updater === "function") {
      setHiddenIds((prev) => updater(prev));
    } else {
      setHiddenIds(updater instanceof Set ? updater : new Set(updater || []));
    }
  }, []);

  // * Initial fetch
  useEffect(() => {
    isMountedRef.current = true;
    fetchNames();

    return () => {
      isMountedRef.current = false;
      clearAllTimeouts();
    };
  }, [fetchNames, clearAllTimeouts]);

  return {
    names,
    hiddenIds,
    isLoading,
    error,
    refetch,
    setNames: updateNames,
    setHiddenIds: updateHiddenIds,
  };
}
