/**
 * @module useNameSelection
 * @description Unified hook for managing name selection state for both Tournament and Profile views.
 * Supports different selection patterns based on mode.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { resolveSupabaseClient } from "../../integrations/supabase/client";
import { tournamentsAPI } from "../../integrations/supabase/api";
import { devLog } from "../../shared/utils/coreUtils";
import { ErrorManager } from "../../shared/services/errorManager";

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
  // * Tournament mode: array of name objects
  // * Profile mode: Set of name IDs
  const [selectedNames, setSelectedNames] = useState(
    mode === "tournament" ? [] : new Set(),
  );

  const saveTimeoutRef = useRef(null);
  const lastSavedHashRef = useRef("");

  // * Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // * Save tournament selections to database (tournament mode only)
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

  // * Schedule save with debouncing (tournament mode only)
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

  // * Tournament mode: toggle name object
  // * Profile mode: toggle name ID
  const toggleName = useCallback(
    (nameOrId) => {
      if (mode === "tournament") {
        // Tournament mode: nameOrId is a name object
        setSelectedNames((prev) => {
          const newSelectedNames = prev.some((n) => n.id === nameOrId.id)
            ? prev.filter((n) => n.id !== nameOrId.id)
            : [...prev, nameOrId];

          // Log the updated selected names (throttled)
          if (
            !toggleName.lastLogTs ||
            Date.now() - toggleName.lastLogTs > 1000
          ) {
            if (process.env.NODE_ENV === "development") {
              devLog("🎮 TournamentSetup: Selected names updated", newSelectedNames);
            }
            toggleName.lastLogTs = Date.now();
          }

          // Debounce save of selections to database
          scheduleSave(newSelectedNames);

          return newSelectedNames;
        });
      } else {
        // Profile mode: nameOrId is a name ID string
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

  // * Tournament mode: toggle selection by name ID and selected state
  // * Profile mode: same behavior
  const toggleNameById = useCallback(
    (nameId, selected) => {
      if (mode === "tournament") {
        // Tournament mode: find name object and toggle it
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
        // Profile mode: toggle by ID
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

  // * Select all names
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
        } else {
          return new Set(names.map((name) => name.id));
        }
      });
    }
  }, [mode, names]);

  // * Clear all selections
  const clearSelection = useCallback(() => {
    if (mode === "tournament") {
      setSelectedNames([]);
    } else {
      setSelectedNames(new Set());
    }
  }, [mode]);

  // * Check if a name is selected
  const isSelected = useCallback(
    (nameOrId) => {
      if (mode === "tournament") {
        // nameOrId is a name object
        return selectedNames.some((n) => n.id === nameOrId.id);
      } else {
        // nameOrId is a name ID string
        return selectedNames.has(nameOrId);
      }
    },
    [mode, selectedNames],
  );

  // * Get selected count
  const selectedCount =
    mode === "tournament" ? selectedNames.length : selectedNames.size;

  return {
    selectedNames,
    setSelectedNames,
    toggleName,
    toggleNameById,
    selectAll,
    clearSelection,
    isSelected,
    selectedCount,
  };
}
