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
          createTimeout(10000, "Supabase client timeout after 10 seconds");

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
      let hiddenData;

      if (mode === "tournament") {
        // Tournament mode: fetch all names (global hidden names are already filtered by getNamesWithDescriptions)
        try {
          const { promise: fetchTimeout, timeoutId: fetchTimeoutId } =
            createTimeout(15000, "Data fetch timeout after 15 seconds");

          // getNamesWithDescriptions already filters out globally hidden names (cat_name_options.is_hidden)
          // Also fetch the hidden count for logging purposes
          const fetchPromise = Promise.all([
            getNamesWithDescriptions(),
            supabaseClient
              .from("cat_name_options")
              .select("id")
              .eq("is_hidden", true),
          ]);

          const result = await Promise.race([fetchPromise, fetchTimeout]);

          // * Clear timeout on successful resolution
          if (fetchTimeoutId) {
            clearTimeout(fetchTimeoutId);
            const index = timeoutIdsRef.current.indexOf(fetchTimeoutId);
            if (index > -1) timeoutIdsRef.current.splice(index, 1);
          }

          // * Destructure result safely
          const [namesResult, hiddenResult] = result;
          namesData = namesResult;
          const hiddenDataResult = hiddenResult || {};
          hiddenData = hiddenDataResult.data;
          const hiddenError = hiddenDataResult.error;

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

          if (hiddenError) {
            // Hidden names query error is non-critical, just log it
            if (process.env.NODE_ENV === "development") {
              console.warn("⚠️ Error fetching hidden names:", hiddenError);
            }
            hiddenData = [];
          }
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

        // Extract hidden IDs from the names data (user-specific)
        hiddenData = namesData
          .filter((name) => name.isHidden)
          .map((name) => ({ name_id: name.id }));

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

      // * Create Set of hidden IDs for O(1) lookup
      // For tournament mode, hiddenData comes from cat_name_options query (has 'id')
      // For profile mode, hiddenData is mapped from names (has 'name_id')
      const hiddenIdsSet = new Set(
        hiddenData?.map((item) => item.id || item.name_id) || [],
      );

      // * Filter out hidden names (tournament mode only - profile shows all)
      let filteredNames = namesData;
      if (mode === "tournament") {
        filteredNames = namesData.filter((name) => !hiddenIdsSet.has(name.id));
      }

      // * Sort names alphabetically for better UX
      const sortedNames = filteredNames.sort((a, b) =>
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
