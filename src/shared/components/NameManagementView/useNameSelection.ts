/**
 * @module useNameSelection
 * @description Unified hook for managing name selection state for both Tournament and Profile views.
 * Supports different selection patterns based on mode.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import {
  resolveSupabaseClient,
  tournamentsAPI,
} from "../../services/supabase/supabaseClient";
import { devLog } from "../../utils/coreUtils";
import { ErrorManager } from "../../services/errorManager/index";

/**
 * Unified hook for name selection management
 * @param {Object} options
 * @param {Array} options.names - Available names array
 * @param {string} options.mode - Display mode: 'tournament' or 'profile'
 * @param {string} options.userName - Current user name (required for tournament mode)
 * @param {boolean} options.enableAutoSave - Whether to auto-save selections (tournament mode only, default: true)
 * @returns {Object} Selection state and handlers
 */
interface Name {
  id: string;
  name: string;
  [key: string]: unknown;
}

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
