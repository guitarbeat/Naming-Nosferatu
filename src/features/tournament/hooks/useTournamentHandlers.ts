import { useCallback } from "react";
import type { RatingData } from "@/shared/types";
import type { TournamentActions } from "@/store/appStore";

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

                        ratingsAPI
                                .saveRatings(uName, ratings)
                                .then(async (result) => {
                                        if (!result?.success) {
                                                await enqueueRatingsMutation(records);
                                                console.warn("Ratings save failed; queued for offline sync");
                                        }
                                })
                                .catch(async () => {
                                        await enqueueRatingsMutation(records);
                                        console.warn("Ratings save error; queued for offline sync");
                                });
                },
                [tournamentActions, userName],
        );

	return {
		handleTournamentComplete,
		handleStartNewTournament,
		handleUpdateRatings,
	};
}
