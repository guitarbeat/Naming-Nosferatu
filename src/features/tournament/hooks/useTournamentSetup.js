/**
 * @module TournamentSetup/hooks/useTournamentSetup
 * @description Custom hook for tournament setup logic, data fetching, and selection state
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { resolveSupabaseClient } from "../../../integrations/supabase/client";
import {
  getNamesWithDescriptions,
  tournamentsAPI,
} from "../../../integrations/supabase/api";
import { devLog } from "../../../shared/utils/coreUtils";
import useAppStore from "../../../core/store/useAppStore";
import { FALLBACK_NAMES } from "../constants";

/**
 * Custom hook for tournament setup logic
 * @param {string} userName - Current user name
 * @returns {Object} Tournament setup state and handlers
 */
export function useTournamentSetup(userName) {
  const [availableNames, setAvailableNames] = useState([]);
  const [selectedNames, setSelectedNames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const saveTimeoutRef = useRef(null);
  const lastSavedHashRef = useRef("");

  // * Get error state and actions from store
  const { errors, errorActions } = useAppStore();

  useEffect(() => {
    const fetchNames = async () => {
      try {
        setIsLoading(true);
        const supabaseClient = await resolveSupabaseClient();

        if (!supabaseClient) {
          setAvailableNames(FALLBACK_NAMES);
          setIsLoading(false);
          return;
        }

        // Get all names and hidden names in parallel for efficiency
        const [namesData, { data: hiddenData, error: hiddenError }] =
          await Promise.all([
            getNamesWithDescriptions(),
            supabaseClient
              .from("cat_name_ratings")
              .select("name_id")
              .eq("is_hidden", true),
          ]);

        if (hiddenError) {
          throw hiddenError;
        }

        // Create Set of hidden IDs for O(1) lookup
        const hiddenIds = new Set(
          hiddenData?.map((item) => item.name_id) || []
        );

        // Filter out hidden names
        const filteredNames = namesData.filter(
          (name) => !hiddenIds.has(name.id)
        );

        // Sort names alphabetically for better UX
        const sortedNames = filteredNames.sort((a, b) =>
          a.name.localeCompare(b.name)
        );

        devLog("🎮 TournamentSetup: Data loaded", {
          availableNames: sortedNames.length,
          hiddenNames: hiddenIds.size,
          userPreferences: hiddenData?.length || 0,
        });

        setAvailableNames(sortedNames);

        // If any currently selected names are now hidden, remove them
        setSelectedNames((prev) =>
          prev.filter((name) => !hiddenIds.has(name.id))
        );
      } catch (err) {
        // Provide a clear offline fallback list when backend fails
        setAvailableNames(FALLBACK_NAMES);
        errorActions.logError(err, "TournamentSetup - Fetch Names", {
          isRetryable: true,
          affectsUserData: false,
          isCritical: false,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchNames();
  }, [errorActions, userName]);

  // Save tournament selections to database
  const saveTournamentSelections = useCallback(
    async (selectedNames) => {
      try {
        // Create a unique tournament ID for this selection session
        const tournamentId = `selection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Save selections to database
        const supabaseClient = await resolveSupabaseClient();

        if (!supabaseClient) return;

        const result = await tournamentsAPI.saveTournamentSelections(
          userName,
          selectedNames,
          tournamentId
        );

        devLog("🎮 TournamentSetup: Selections saved to database", result);
      } catch (error) {
        console.error("Error saving tournament selections:", error);
        // Don't block the UI if saving fails
      }
    },
    [userName]
  );

  const scheduleSave = useCallback(
    (namesToSave) => {
      if (!userName || !Array.isArray(namesToSave) || namesToSave.length === 0)
        return;

      const hash = namesToSave
        .map((n) => n.id || n.name)
        .sort()
        .join(",");

      if (hash === lastSavedHashRef.current) return;

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        lastSavedHashRef.current = hash;
        saveTournamentSelections(namesToSave).catch((e) =>
          console.warn("Save selections debounce error:", e)
        );
      }, 800);
    },
    [userName, saveTournamentSelections]
  );

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const toggleName = async (nameObj) => {
    setSelectedNames((prev) => {
      const newSelectedNames = prev.some((n) => n.id === nameObj.id)
        ? prev.filter((n) => n.id !== nameObj.id)
        : [...prev, nameObj];

      // Log the updated selected names (throttled to avoid spam)
      if (!toggleName.lastLogTs || Date.now() - toggleName.lastLogTs > 1000) {
        devLog("🎮 TournamentSetup: Selected names updated", newSelectedNames);
        toggleName.lastLogTs = Date.now();
      }

      // Debounce save of selections to database
      scheduleSave(newSelectedNames);

      return newSelectedNames;
    });
  };

  const handleSelectAll = () => {
    setSelectedNames(
      selectedNames.length === availableNames.length ? [] : [...availableNames]
    );
  };

  return {
    availableNames,
    selectedNames,
    isLoading,
    errors: errors.history,
    isError: !!errors.current,
    clearErrors: () => errorActions.clearError(),
    clearError: () => errorActions.clearError(),
    toggleName,
    handleSelectAll,
  };
}

