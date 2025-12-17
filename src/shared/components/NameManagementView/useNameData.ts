// @ts-nocheck
/**
 * @module useNameData
 * @description Unified hook for fetching name data for both Tournament and Profile views.
 * Handles differences in data requirements between modes.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { resolveSupabaseClient } from "../../services/supabase/client";
import {
  getNamesWithDescriptions,
  getNamesWithUserRatings,
} from "../../services/supabase/api";
import { devLog } from "../../utils/coreUtils";
import { ErrorManager } from "../../services/errorManager";
import { FALLBACK_NAMES } from "../../../features/tournament/constants";
import { TIMING } from "../../../core/constants";

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

  const createTimeout = useCallback((ms, errorMsg) => {
    let timeoutId = null;
    const promise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(errorMsg)), ms);
      timeoutIdsRef.current.push(timeoutId);
    });
    return { promise, timeoutId };
  }, []);

  const clearAllTimeouts = useCallback(() => {
    timeoutIdsRef.current.forEach((id) => clearTimeout(id));
    timeoutIdsRef.current = [];
  }, []);

  const fetchNames = useCallback(async () => {
    clearAllTimeouts();
    try {
      setIsLoading(true);
      setError(null);

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

        if (clientTimeoutId) {
          clearTimeout(clientTimeoutId);
          const index = timeoutIdsRef.current.indexOf(clientTimeoutId);
          if (index > -1) timeoutIdsRef.current.splice(index, 1);
        }
      } catch (timeoutError) {
        clearAllTimeouts();
        setNames(mode === "tournament" ? FALLBACK_NAMES : []);
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
        setNames(mode === "tournament" ? FALLBACK_NAMES : []);
        setIsLoading(false);
        return;
      }

      let namesData;

      if (mode === "tournament") {
        try {
          const { promise: fetchTimeout, timeoutId: fetchTimeoutId } =
            createTimeout(15000, "Data fetch timeout after 15 seconds");

          const fetchPromise = getNamesWithDescriptions(true);
          namesData = await Promise.race([fetchPromise, fetchTimeout]);

          if (fetchTimeoutId) {
            clearTimeout(fetchTimeoutId);
            const index = timeoutIdsRef.current.indexOf(fetchTimeoutId);
            if (index > -1) timeoutIdsRef.current.splice(index, 1);
          }

          if (
            Array.isArray(namesData) &&
            namesData.length > 0 &&
            namesData[0]?.description?.includes("temporary fallback")
          ) {
            if (process.env.NODE_ENV === "development") {
              console.warn(
                "⚠️ Backend returned fallback names - Supabase may not be fully available",
              );
            }
          }
        } catch (timeoutError) {
          clearAllTimeouts();
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
          throw timeoutError;
        }
      } else {
        if (!userName) {
          setIsLoading(false);
          return;
        }

        namesData = await getNamesWithUserRatings(userName);

        namesData = namesData.map((name) => ({
          ...name,
          owner: userName,
        }));
      }

      if (!isMountedRef.current) return;

      if (!Array.isArray(namesData)) {
        throw new Error("Invalid response: namesData is not an array");
      }

      const hiddenIdsSet = new Set(
        namesData
          .filter((name) => name.is_hidden === true)
          .map((name) => name.id),
      );

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
      setNames(mode === "tournament" ? FALLBACK_NAMES : []);
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

  const refetch = useCallback(() => {
    fetchNames();
  }, [fetchNames]);

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
