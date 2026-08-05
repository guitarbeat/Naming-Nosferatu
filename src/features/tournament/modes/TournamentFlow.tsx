import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import { AudioEffects } from "@/shared/lib/sound";
import { ratingsAPI } from "@/shared/services/supabase/ratingService";
import { getTelemetryAdapter } from "@/shared/services/telemetrySeam";
import useAppStore from "@/store/appStore";
import { NameSelector } from "../components/NameSelector";

export default function TournamentFlow() {
	const user = useAppStore((s) => s.user);
	const tournament = useAppStore((s) => s.tournament);
	const tournamentActions = useAppStore((s) => s.tournamentActions);
	const prefersReducedMotion = useReducedMotion();

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
	mutateAsyncRef.current = saveRatingsMutation.mutateAsync;

	useEffect(() => {
		if (tournament.isComplete) {
			AudioEffects.playMeow();
		}
	}, [tournament.isComplete]);

	useEffect(() => {
		if (tournament.isComplete && Object.keys(tournament.ratings).length > 0) {
			const userId = user.id || user.name || "anonymous";

			const ratingsWithStats = Object.entries(tournament.ratings).reduce(
				(acc, [nameId, ratingData]) => {
					const rating =
						typeof ratingData === "number" ? ratingData : ratingData.rating;
					const wins =
						typeof ratingData === "number" ? 0 : (ratingData.wins ?? 0);
					const losses =
						typeof ratingData === "number" ? 0 : (ratingData.losses ?? 0);
					acc[nameId] = {
						rating,
						wins,
						losses,
					};
					return acc;
				},
				{} as Record<string, { rating: number; wins: number; losses: number }>,
			);

			mutateAsyncRef
				.current({ userId, ratings: ratingsWithStats })
				.catch((_error) => {
					getTelemetryAdapter().captureException(
						_error instanceof Error ? _error : new Error(String(_error)),
						"Tournament ratings save failed — ratings were not persisted",
					);
				});
		}
	}, [tournament.isComplete, tournament.ratings, user.id, user.name]);

	return (
		<div className="w-full flex flex-col gap-2">
			<AnimatePresence mode="wait">
				{!tournament.isComplete && (
					<motion.div
						key="setup"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="w-full py-0"
					>
						<NameSelector />
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
