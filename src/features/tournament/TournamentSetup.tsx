import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { ratingsAPI } from "@/shared/api";
import { fadeMotionPreset } from "@/shared/lib/uiUtils";
import useAppStore from "@/store";
import { NameSelector } from "./NameSelector";
import { NameSuggestion, NameSuggestionInner } from "./NameSuggestion";

export { NameSelector, NameSuggestion, NameSuggestionInner };

export function TournamentSetup() {
	const user = useAppStore((s) => s.user);
	const tournament = useAppStore((s) => s.tournament);
	const _tournamentActions = useAppStore((s) => s.tournamentActions);

	const saveRatingsMutation = useMutation({
		mutationFn: ({
			userId,
			ratings,
		}: {
			userId: string;
			ratings: Record<string, { rating: number; wins: number; losses: number }>;
		}) => ratingsAPI.saveRatings(userId, ratings),
	});

	const mutateAsyncRef = useRef(saveRatingsMutation.mutateAsync);
	useEffect(() => {
		mutateAsyncRef.current = saveRatingsMutation.mutateAsync;
	}, [saveRatingsMutation.mutateAsync]);

	useEffect(() => {
		if (tournament.isComplete && Object.keys(tournament.ratings).length > 0) {
			const userId = user.id || user.name || "anonymous";

			const ratingsWithStats: Record<string, { rating: number; wins: number; losses: number }> = {};
			for (const nameId in tournament.ratings) {
				if (Object.hasOwn(tournament.ratings, nameId)) {
					const ratingData = tournament.ratings[nameId];
					const rating = typeof ratingData === "number" ? ratingData : ratingData.rating;
					const wins = typeof ratingData === "number" ? 0 : (ratingData.wins ?? 0);
					const losses = typeof ratingData === "number" ? 0 : (ratingData.losses ?? 0);
					ratingsWithStats[nameId] = {
						rating,
						wins,
						losses,
					};
				}
			}

			mutateAsyncRef.current({ userId, ratings: ratingsWithStats }).catch((_error) => {
				console.error("Tournament ratings save failed — ratings were not persisted", _error);
			});
		}
	}, [tournament.isComplete, tournament.ratings, user.id, user.name]);

	return (
		<div className="w-full flex flex-col gap-2">
			<AnimatePresence mode="wait">
				{!tournament.isComplete && (
					<motion.div key="setup" {...fadeMotionPreset} className="w-full py-0">
						<NameSelector />
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
