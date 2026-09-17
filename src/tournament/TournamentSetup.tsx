import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import { ratingsAPI } from "@/api";
import { normalizeRatingsWithStats } from "@/lib/names";
import { fadeMotionPreset } from "@/lib/uiUtils";
import useAppStore, { useTournamentSetupState } from "@/store";
import type { RatingData } from "@/types";
import { useInertiaScroll } from "./hooks";
import { NameSelector } from "./NameSelector";
import { TournamentArena } from "./TournamentArena";

export function TournamentSetup() {
	const { names, isComplete, ratings, userId, userName } = useTournamentSetupState();
	const tournamentActions = useAppStore((s) => s.tournamentActions);
	const hasSavedRef = useRef(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const prefersReducedMotion = useReducedMotion();

	useInertiaScroll(containerRef, prefersReducedMotion);

	const saveRatingsMutation = useMutation({
		mutationFn: ({ userId, ratings }: { userId: string; ratings: Record<string, RatingData> }) =>
			ratingsAPI.saveRatings(userId, ratings),
		onError: (error) => {
			console.error("Tournament ratings save failed — ratings were not persisted", error);
		},
	});

	useEffect(() => {
		if (!isComplete) {
			hasSavedRef.current = false;
			return;
		}
		if (hasSavedRef.current) {
			return;
		}
		if (Object.keys(ratings).length > 0) {
			hasSavedRef.current = true;
			const effectiveUserId = userId || userName || "anonymous";
			const ratingsWithStats = normalizeRatingsWithStats(ratings);
			saveRatingsMutation.mutate({ userId: effectiveUserId, ratings: ratingsWithStats });
		}
	}, [isComplete, ratings, userId, userName, saveRatingsMutation.mutate]);

	return (
		<div ref={containerRef} className="w-full flex flex-col flex-1 min-h-[520px] gap-2">
			<AnimatePresence mode="wait">
				{names && names.length >= 2 ? (
					<motion.div
						key="arena"
						{...fadeMotionPreset}
						className="w-full flex flex-col flex-1 min-h-[520px] py-0"
					>
						<TournamentArena
							names={names}
							onComplete={(completedRatings) => {
								tournamentActions.completeTournament(completedRatings);
							}}
							userName={userName ?? undefined}
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
