import { useCallback } from "react";
import type { NameItem, TournamentActions } from "../../shared/propTypes";
import { ErrorManager } from "../../shared/services/errorManager";
import { tournamentsAPI } from "../../shared/services/supabase/supabaseClient";
import {
	clearTournamentCache,
	devError,
	devLog,
	devWarn,
	isNameHidden,
	ratingsToArray,
	ratingsToObject,
} from "../../shared/utils/coreUtils";

/**
 * Custom hook for tournament-related handlers
 * Extracts tournament logic from App component for better organization
 */
interface UseTournamentHandlersProps {
	userName: string | null;
	tournamentActions: TournamentActions;
	navigateTo: (path: string) => void;
}

export function useTournamentHandlers({
	userName,
	tournamentActions,
	navigateTo,
}: UseTournamentHandlersProps) {
	/**
	 * Handles the completion of a tournament.
	 * Saves ratings, updates state, and navigates to results.
	 */
	const handleTournamentComplete = useCallback(
		async (
			finalRatings: Record<
				string,
				{ rating: number; wins?: number; losses?: number }
			>,
		) => {
			try {
				devLog("[App] handleTournamentComplete called with:", finalRatings);

				if (!userName) {
					throw new Error("No user name available for saving results");
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
					// We continue even if save fails, to show results locally
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

	/**
	 * Resets the tournament state to start a new one.
	 */
	const handleStartNewTournament = useCallback(() => {
		tournamentActions.resetTournament();
	}, [tournamentActions]);

	/**
	 * Sets up the tournament with the provided names.
	 * Filters hidden names and initializes state.
	 */
	const handleTournamentSetup = useCallback(
		(names: NameItem[] | undefined) => {
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

	/**
	 * Updates ratings during the tournament (e.g. after each match).
	 */
	const handleUpdateRatings = useCallback(
		async (
			adjustedRatings: Record<
				string,
				{ rating: number; wins?: number; losses?: number }
			>,
		) => {
			try {
				// * Convert ratings using utility functions
				const ratingsArray = ratingsToArray(adjustedRatings);

				// * Save ratings to database
				if (userName) {
					const saveResult = await tournamentsAPI.saveTournamentRatings(
						userName,
						ratingsArray,
					);

					if (!saveResult.success) {
						devWarn("[App] Failed to auto-save ratings:", saveResult.error);
					} else {
						devLog("[App] Update ratings result:", saveResult);
					}
				}

				// * Convert to object format for store
				const updatedRatings = ratingsToObject(ratingsArray);

				tournamentActions.setRatings(updatedRatings);
				return true;
			} catch (error) {
				// Log but don't crash the app for auto-save errors
				devError("[App] Error in handleUpdateRatings:", error);
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
