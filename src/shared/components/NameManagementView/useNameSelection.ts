// @ts-nocheck
/**
 * @module useNameSelection
 * @description Unified hook for managing name selection state for both Tournament and Profile views.
 * Supports different selection patterns based on mode.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { resolveSupabaseClient } from "../../services/supabase/client";
import { tournamentsAPI } from "../../services/supabase/api";
import { devLog } from "../../utils/coreUtils";
import { ErrorManager } from "../../services/errorManager";

/**
 * Unified hook for name selection management
 * @param {Object} options
 * @param {Array} options.names - Available names array
 * @param {string} options.mode - Display mode: 'tournament' or 'profile'
 * @param {string} options.userName - Current user name (required for tournament mode)
 * @param {boolean} options.enableAutoSave - Whether to auto-save selections (tournament mode only, default: true)
 * @returns {Object} Selection state and handlers
 */
export function useNameSelection({
  names = [],
  mode = "tournament",
  userName,
  enableAutoSave = true,
}) {
  const [selectedNames, setSelectedNames] = useState(
    mode === "tournament" ? [] : new Set(),
  );

  const saveTimeoutRef = useRef(null);
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
    async (namesToSave) => {
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
    (namesToSave) => {
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
    (nameOrId) => {
      if (mode === "tournament") {
        setSelectedNames((prev) => {
          const newSelectedNames = prev.some((n) => n.id === nameOrId.id)
            ? prev.filter((n) => n.id !== nameOrId.id)
            : [...prev, nameOrId];

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
          const newSet = new Set(prev);
          if (newSet.has(nameOrId)) {
            newSet.delete(nameOrId);
          } else {
            newSet.add(nameOrId);
          }
          return newSet;
        });
      }
    },
    [mode, scheduleSave],
  );

  const toggleNameById = useCallback(
    (nameId, selected) => {
      if (mode === "tournament") {
        const nameObj = names.find((n) => n.id === nameId);
        if (nameObj) {
          if (selected) {
            setSelectedNames((prev) => {
              if (prev.some((n) => n.id === nameId)) return prev;
              const newSelectedNames = [...prev, nameObj];
              scheduleSave(newSelectedNames);
              return newSelectedNames;
            });
          } else {
            setSelectedNames((prev) => {
              const newSelectedNames = prev.filter((n) => n.id !== nameId);
              scheduleSave(newSelectedNames);
              return newSelectedNames;
            });
          }
        }
      } else {
        setSelectedNames((prev) => {
          const newSet = new Set(prev);
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
    (nameIds = [], shouldSelect = true) => {
      if (!Array.isArray(nameIds) || nameIds.length === 0) {
        return;
      }
      const idSet = new Set(nameIds);
      if (mode === "tournament") {
        setSelectedNames((prev) => {
          if (shouldSelect) {
            const additions = names.filter(
              (name) =>
                idSet.has(name.id) &&
                !prev.some((selected) => selected.id === name.id),
            );
            if (additions.length === 0) return prev;
            const updated = [...prev, ...additions];
            scheduleSave(updated);
            return updated;
          }
          const updated = prev.filter((name) => !idSet.has(name.id));
          if (updated.length === prev.length) return prev;
          scheduleSave(updated);
          return updated;
        });
      } else {
        setSelectedNames((prev) => {
          const updated = new Set(prev);
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
        const allSelected = prev.length === names.length;
        return allSelected ? [] : [...names];
      });
    } else {
      setSelectedNames((prev) => {
        const allSelected = names.every((name) => prev.has(name.id));
        if (allSelected) {
          return new Set();
        }
        return new Set(names.map((name) => name.id));
      });
    }
  }, [mode, names]);

  const clearSelection = useCallback(() => {
    if (mode === "tournament") {
      setSelectedNames([]);
    } else {
      setSelectedNames(new Set());
    }
  }, [mode]);

  const isSelected = useCallback(
    (nameOrId) => {
      if (mode === "tournament") {
        return selectedNames.some((n) => n.id === nameOrId.id);
      }
      return selectedNames.has(nameOrId);
    },
    [mode, selectedNames],
  );

  const selectedCount =
    mode === "tournament" ? selectedNames.length : selectedNames.size;

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
