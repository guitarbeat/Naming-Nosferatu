import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { ratingsAPI } from "@/api";
import { normalizeRatingsWithStats } from "@/lib/names";
import { fadeMotionPreset } from "@/lib/uiUtils";
import useAppStore from "@/store";
import type { RatingData } from "@/types";
import { NameSelector } from "./NameSelector";
import { TournamentArena } from "./TournamentArena";

export function TournamentSetup() {
	const user = useAppStore((s) => s.user);
	const tournament = useAppStore((s) => s.tournament);
	const tournamentActions = useAppStore((s) => s.tournamentActions);
	const hasSavedRef = useRef(false);

	const saveRatingsMutation = useMutation({
		mutationFn: ({ userId, ratings }: { userId: string; ratings: Record<string, RatingData> }) =>
			ratingsAPI.saveRatings(userId, ratings),
		onError: (error) => {
			console.error("Tournament ratings save failed — ratings were not persisted", error);
		},
	});

	useEffect(() => {
		if (!tournament.isComplete) {
			hasSavedRef.current = false;
			return;
		}
		if (hasSavedRef.current) {
			return;
		}
		if (Object.keys(tournament.ratings).length > 0) {
			hasSavedRef.current = true;
			const userId = user.id || user.name || "anonymous";
			const ratingsWithStats = normalizeRatingsWithStats(tournament.ratings);
			saveRatingsMutation.mutate({ userId, ratings: ratingsWithStats });
		}
	}, [tournament.isComplete, tournament.ratings, user.id, user.name, saveRatingsMutation.mutate]);

	return (
		<div className="w-full flex flex-col flex-1 min-h-[520px] gap-2">
			<AnimatePresence mode="wait">
				{tournament.names && tournament.names.length >= 2 ? (
					<motion.div
						key="arena"
						{...fadeMotionPreset}
						className="w-full flex flex-col flex-1 min-h-[520px] py-0"
					>
						<TournamentArena
							names={tournament.names}
							onComplete={(ratings) => {
								tournamentActions.completeTournament(ratings);
							}}
							userName={user.name ?? undefined}
						/>
					</motion.div>
				) : (
					<motion.div
						key="setup"
						{...fadeMotionPreset}
						className="w-full flex flex-col flex-1 min-h-[520px] py-0"
					>
						<NameSelector />
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
