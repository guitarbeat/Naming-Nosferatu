/**
 * @module useNameData
 * @description Unified hook for fetching name data for both Tournament and Profile views.
 * Handles differences in data requirements between modes.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { resolveSupabaseClient } from "../../services/supabase/supabaseClient";
import {
  getNamesWithDescriptions,
  getNamesWithUserRatings,
} from "../../services/supabase/api";
import { devLog } from "../../utils/coreUtils";
import { ErrorManager } from "../../services/errorManager/index";
import { FALLBACK_NAMES } from "../../../features/tournament/constants";
import { TIMING } from "../../../core/constants";

interface Name {
  id: string;
  name: string;
  description?: string;
  is_hidden?: boolean;
  [key: string]: unknown;
}

/**
 * Unified hook for fetching name data
 * @param {Object} options
 * @param {string} options.userName - Current user name
 * @param {string} options.mode - Display mode: 'tournament' or 'profile'
 * @param {boolean} options.enableErrorHandling - Whether to use ErrorManager (default: true)
 * @returns {Object} Name data state and handlers
 */
interface UseNameDataProps {
  userName: string | null;
  mode?: "tournament" | "profile";
  enableErrorHandling?: boolean;
}

export function useNameData({
  userName,
  mode = "tournament",
  enableErrorHandling = true,
}: UseNameDataProps) {
  const [names, setNames] = useState<Name[]>([]);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const isMountedRef = useRef(true);
  const timeoutIdsRef = useRef<NodeJS.Timeout[]>([]);

  const createTimeout = useCallback((ms: number, errorMsg: string) => {
    let timeoutId: NodeJS.Timeout | null = null;
    const promise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(errorMsg)), ms);
      if (timeoutId) timeoutIdsRef.current.push(timeoutId);
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

      let namesData: Name[];

      if (mode === "tournament") {
        try {
          const { promise: fetchTimeout, timeoutId: fetchTimeoutId } =
            createTimeout(15000, "Data fetch timeout after 15 seconds");

          const fetchPromise = getNamesWithDescriptions(true);
          namesData = (await Promise.race([
            fetchPromise,
            fetchTimeout,
          ])) as Name[];

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
        } catch (timeoutError: unknown) {
          clearAllTimeouts();
          const err = timeoutError as Error;
          if (err.message?.includes("timeout")) {
            setNames(FALLBACK_NAMES as Name[]);
            setIsLoading(false);
            if (enableErrorHandling) {
              ErrorManager.handleError(
                err,
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
          throw err;
        }
      } else {
        if (!userName) {
          setIsLoading(false);
          return;
        }

        const rawData = await getNamesWithUserRatings(userName);

        namesData = (rawData as Array<{ id: string; name: string;[key: string]: unknown }>).map(
          (name) => ({
            ...name,
            owner: userName,
          }),
        ) as Name[];
      }

      if (!isMountedRef.current) return;

      if (!Array.isArray(namesData)) {
        throw new Error("Invalid response: namesData is not an array");
      }

      const hiddenIdsSet = new Set(
        namesData
          .filter((name: Name) => name.is_hidden === true)
          .map((name: Name) => name.id),
      );

      const sortedNames = [...namesData].sort((a: Name, b: Name) =>
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

  const updateNames = useCallback(
    (updater: Name[] | ((prev: Name[]) => Name[])) => {
      if (typeof updater === "function") {
        setNames((prev) => updater(prev));
      } else {
        setNames(updater);
      }
    },
    [],
  );

  const updateHiddenIds = useCallback(
    (
      updater: Set<string> | string[] | ((prev: Set<string>) => Set<string>),
    ) => {
      if (typeof updater === "function") {
        setHiddenIds((prev) => updater(prev));
      } else {
        setHiddenIds(updater instanceof Set ? updater : new Set(updater || []));
      }
    },
    [],
  );

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
