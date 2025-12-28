/**
 * @module useNameManagement
 * @description Consolidated hooks for name data fetching and selection management
 * Combines useNameData and useNameSelection for unified name management
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  resolveSupabaseClient,
  getNamesWithDescriptions,
  getNamesWithUserRatings,
  tournamentsAPI,
} from "../../services/supabase/supabaseClient";
import { devLog } from "../../utils/coreUtils";
import { ErrorManager } from "../../services/errorManager/index";
import { FALLBACK_NAMES } from "../../../features/tournament/config";
import { TIMING } from "../../../core/constants";

// ============================================================================
// Types
// ============================================================================

interface Name {
  id: string;
  name: string;
  description?: string;
  is_hidden?: boolean;
  [key: string]: unknown;
}

// ============================================================================
// Name Data Hook
// ============================================================================

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

// ============================================================================
// Name Selection Hook
// ============================================================================

interface UseNameSelectionProps {
  names?: Name[];
  mode?: "tournament" | "profile";
  userName: string | null;
  enableAutoSave?: boolean;
}

export function useNameSelection({
  names = [],
  mode = "tournament",
  userName,
  enableAutoSave = true,
}: UseNameSelectionProps) {
  const [selectedNames, setSelectedNames] = useState<Name[] | Set<string>>(
    mode === "tournament" ? [] : new Set<string>(),
  );

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedHashRef = useRef("");
  const lastLogTsRef = useRef(0);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const saveTournamentSelections = useCallback(
    async (namesToSave: Name[]) => {
      if (mode !== "tournament" || !userName) return;
      try {
        const tournamentId = `selection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const supabaseClient = await resolveSupabaseClient();
        if (!supabaseClient) return;

        const result = await tournamentsAPI.saveTournamentSelections(
          userName,
          namesToSave,
          tournamentId,
        );
        if (process.env.NODE_ENV === "development") {
          devLog("🎮 TournamentSetup: Selections saved to database", result);
        }
      } catch (error) {
        ErrorManager.handleError(error, "Save Tournament Selections", {
          isRetryable: true,
          affectsUserData: false,
          isCritical: false,
        });
      }
    },
    [mode, userName],
  );

  const scheduleSave = useCallback(
    (namesToSave: Name[]) => {
      if (mode !== "tournament" || !enableAutoSave || !userName) return;
      if (!Array.isArray(namesToSave) || namesToSave.length === 0) return;

      const hash = namesToSave
        .map((n) => n.id || n.name)
        .sort()
        .join(",");

      if (hash === lastSavedHashRef.current) return;

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        lastSavedHashRef.current = hash;
        saveTournamentSelections(namesToSave).catch((e) =>
          ErrorManager.handleError(e, "Save Tournament Selections Debounce", {
            isRetryable: true,
            affectsUserData: false,
            isCritical: false,
          }),
        );
      }, 800);
    },
    [mode, userName, enableAutoSave, saveTournamentSelections],
  );

  const toggleName = useCallback(
    (nameOrId: Name | string) => {
      if (mode === "tournament") {
        setSelectedNames((prev) => {
          const prevArray = prev as Name[];
          const nameObj = nameOrId as Name;
          const newSelectedNames = prevArray.some(
            (n: Name) => n.id === nameObj.id,
          )
            ? prevArray.filter((n: Name) => n.id !== nameObj.id)
            : [...prevArray, nameObj];

          if (
            Date.now() - lastLogTsRef.current > 1000 &&
            process.env.NODE_ENV === "development"
          ) {
            devLog(
              "🎮 TournamentSetup: Selected names updated",
              newSelectedNames,
            );
            lastLogTsRef.current = Date.now();
          }

          scheduleSave(newSelectedNames);
          return newSelectedNames;
        });
      } else {
        setSelectedNames((prev) => {
          const newSet = new Set(prev as Set<string>);
          const id = typeof nameOrId === "string" ? nameOrId : nameOrId.id;
          if (newSet.has(id)) {
            newSet.delete(id);
          } else {
            newSet.add(id);
          }
          return newSet;
        });
      }
    },
    [mode, scheduleSave],
  );

  const toggleNameById = useCallback(
    (nameId: string, selected: boolean) => {
      if (mode === "tournament") {
        const nameObj = (names as Name[]).find((n) => n.id === nameId);
        if (nameObj) {
          if (selected) {
            setSelectedNames((prev) => {
              const prevArray = prev as Name[];
              if (prevArray.some((n: Name) => n.id === nameId)) return prev;
              const newSelectedNames = [...prevArray, nameObj];
              scheduleSave(newSelectedNames);
              return newSelectedNames;
            });
          } else {
            setSelectedNames((prev) => {
              const prevArray = prev as Name[];
              const newSelectedNames = prevArray.filter(
                (n: Name) => n.id !== nameId,
              );
              scheduleSave(newSelectedNames);
              return newSelectedNames;
            });
          }
        }
      } else {
        setSelectedNames((prev) => {
          const newSet = new Set(prev as Set<string>);
          if (selected) {
            newSet.add(nameId);
          } else {
            newSet.delete(nameId);
          }
          return newSet;
        });
      }
    },
    [mode, names, scheduleSave],
  );

  const toggleNamesByIds = useCallback(
    (nameIds: string[] = [], shouldSelect = true) => {
      if (!Array.isArray(nameIds) || nameIds.length === 0) {
        return;
      }
      const idSet = new Set(nameIds);
      if (mode === "tournament") {
        setSelectedNames((prev) => {
          const prevArray = prev as Name[];
          if (shouldSelect) {
            const additions = (names as Name[]).filter(
              (name: Name) =>
                idSet.has(name.id) &&
                !prevArray.some((selected: Name) => selected.id === name.id),
            );
            if (additions.length === 0) return prev;
            const updated = [...prevArray, ...additions];
            scheduleSave(updated);
            return updated;
          }
          const updated = prevArray.filter((name: Name) => !idSet.has(name.id));
          if (updated.length === prevArray.length) return prev;
          scheduleSave(updated);
          return updated;
        });
      } else {
        setSelectedNames((prev) => {
          const updated = new Set(prev as Set<string>);
          if (shouldSelect) {
            idSet.forEach((id) => updated.add(id));
          } else {
            idSet.forEach((id) => updated.delete(id));
          }
          return updated;
        });
      }
    },
    [mode, names, scheduleSave],
  );

  const selectAll = useCallback(() => {
    if (mode === "tournament") {
      setSelectedNames((prev) => {
        const prevArray = prev as Name[];
        const allSelected = prevArray.length === names.length;
        return allSelected ? [] : [...names];
      });
    } else {
      setSelectedNames((prev) => {
        const prevSet = prev as Set<string>;
        const allSelected = names.every((name: Name) => prevSet.has(name.id));
        if (allSelected) {
          return new Set<string>();
        }
        return new Set<string>(names.map((name: Name) => name.id));
      });
    }
  }, [mode, names]);

  const clearSelection = useCallback(() => {
    if (mode === "tournament") {
      setSelectedNames([]);
    } else {
      setSelectedNames(new Set<string>());
    }
  }, [mode]);

  const isSelected = useCallback(
    (nameOrId: Name | string) => {
      if (mode === "tournament") {
        const nameObj = nameOrId as Name;
        return (selectedNames as Name[]).some((n: Name) => n.id === nameObj.id);
      }
      const id = typeof nameOrId === "string" ? nameOrId : nameOrId.id;
      return (selectedNames as Set<string>).has(id);
    },
    [mode, selectedNames],
  );

  const selectedCount =
    mode === "tournament"
      ? (selectedNames as Name[]).length
      : (selectedNames as Set<string>).size;

  return {
    selectedNames,
    setSelectedNames,
    toggleName,
    toggleNameById,
    toggleNamesByIds,
    selectAll,
    clearSelection,
    isSelected,
    selectedCount,
  };
}

