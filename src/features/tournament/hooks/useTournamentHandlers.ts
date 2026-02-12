/**
 * Stub: replace with your real useTournamentHandlers hook.
 *
 * Provides callbacks for tournament lifecycle events (complete, start new,
 * update ratings) that coordinate between the store and the API layer.
 */

import { useCallback } from "react";
import type { TournamentActions } from "@/store/appStore";
import type { RatingData } from "@/types/appTypes";

interface UseTournamentHandlersProps {
	userName: string;
	tournamentActions: TournamentActions;
}

export function useTournamentHandlers({ tournamentActions }: UseTournamentHandlersProps) {
	const handleTournamentComplete = useCallback(
		(ratings: Record<string, RatingData>) => {
			tournamentActions.setRatings(ratings);
			tournamentActions.setComplete(true);
		},
		[tournamentActions],
	);

	const handleStartNewTournament = useCallback(() => {
		tournamentActions.resetTournament();
	}, [tournamentActions]);

	const handleUpdateRatings = useCallback(
		(
			ratings:
				| Record<string, RatingData>
				| ((prev: Record<string, RatingData>) => Record<string, RatingData>),
		) => {
			tournamentActions.setRatings(ratings);
		},
		[tournamentActions],
	);

	return {
		handleTournamentComplete,
		handleStartNewTournament,
		handleUpdateRatings,
	};
}
