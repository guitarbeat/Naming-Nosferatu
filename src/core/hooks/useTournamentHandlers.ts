// @ts-nocheck
import { useCallback } from "react";
import { tournamentsAPI } from "@services/supabase/api";
import { ErrorManager } from "@services/errorManager";
import { devLog, devWarn, devError } from "@utils/logger";
import { ratingsToArray, ratingsToObject } from "@utils/ratingUtils";
import { isNameHidden } from "../../shared/utils/nameFilterUtils";
import { clearTournamentCache } from "../../shared/utils/cacheUtils";

/**
 * Custom hook for tournament-related handlers
 * Extracts tournament logic from App component for better organization
 */
export function useTournamentHandlers({
  userName,
  tournamentActions,
  navigateTo,
}) {
  const handleTournamentComplete = useCallback(
    async (finalRatings) => {
      try {
        devLog("[App] handleTournamentComplete called with:", finalRatings);

        if (!userName) {
          throw new Error("No user name available");
        }

        // * Convert ratings using utility functions
        const ratingsArray = ratingsToArray(finalRatings);
        const updatedRatings = ratingsToObject(ratingsArray);

        devLog("[App] Ratings to save:", ratingsArray);

        // * Save ratings to database
        const saveResult = await tournamentsAPI.saveTournamentRatings(
          userName,
          ratingsArray,
        );

        devLog("[App] Save ratings result:", saveResult);

        if (!saveResult.success) {
          devWarn(
            "[App] Failed to save ratings to database:",
            saveResult.error,
          );
        }

        // * Update store with new ratings
        tournamentActions.setRatings(updatedRatings);
        tournamentActions.setComplete(true);

        devLog("[App] Tournament marked as complete, navigating to /results");

        // * Navigate to results page
        navigateTo("/results");
      } catch (error) {
        devError("[App] Error in handleTournamentComplete:", error);
        ErrorManager.handleError(error, "Tournament Completion", {
          isRetryable: true,
          affectsUserData: true,
          isCritical: false,
        });
      }
    },
    [userName, tournamentActions, navigateTo],
  );

  const handleStartNewTournament = useCallback(() => {
    tournamentActions.resetTournament();
  }, [tournamentActions]);

  const handleTournamentSetup = useCallback(
    (names) => {
      // * Clear tournament cache to ensure fresh data
      clearTournamentCache();

      // * Reset tournament state and set loading
      tournamentActions.resetTournament();
      tournamentActions.setLoading(true);

      // * Filter out hidden names before starting tournament
      const processedNames = Array.isArray(names)
        ? names.filter((name) => !isNameHidden(name))
        : [];

      if (processedNames.length === 0) {
        devWarn(
          "[App] No visible names available after filtering hidden names",
        );
        tournamentActions.setLoading(false);
        return;
      }

      tournamentActions.setNames(processedNames);
      // Ensure we are on the tournament view after starting
      tournamentActions.setView("tournament");

      // * Use setTimeout to ensure the loading state is visible and prevent flashing
      setTimeout(() => {
        tournamentActions.setLoading(false);
      }, 100);
    },
    [tournamentActions],
  );

  const handleUpdateRatings = useCallback(
    async (adjustedRatings) => {
      try {
        // * Convert ratings using utility functions
        const ratingsArray = ratingsToArray(adjustedRatings);

        // * Save ratings to database
        if (userName) {
          const saveResult = await tournamentsAPI.saveTournamentRatings(
            userName,
            ratingsArray,
          );

          devLog("[App] Update ratings result:", saveResult);
        }

        // * Convert to object format for store
        const updatedRatings = ratingsToObject(ratingsArray);

        tournamentActions.setRatings(updatedRatings);
        return true;
      } catch (error) {
        ErrorManager.handleError(error, "Rating Update", {
          isRetryable: true,
          affectsUserData: true,
          isCritical: false,
        });
        throw error;
      }
    },
    [tournamentActions, userName],
  );

  return {
    handleTournamentComplete,
    handleStartNewTournament,
    handleTournamentSetup,
    handleUpdateRatings,
  };
}
