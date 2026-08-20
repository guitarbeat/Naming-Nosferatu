import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { useEffect, useRef } from "react";
import { AudioEffects } from "@/shared/lib/sound";
import { ratingsAPI } from "@/shared/services/supabase/ratingService";
import useAppStore from "@/store/appStore";
import { NameSelector } from "../components/NameSelector";
import { TournamentCompleteUI } from "../components/ui/TournamentCompleteUI";

export default function TournamentFlow() {
	const { user, tournament } = useAppStore();

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
			const userId = user.name || "anonymous";

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
					console.warn(
						"Tournament ratings save failed — ratings were not persisted",
					);
				});
		}
	}, [tournament.isComplete, tournament.ratings, user.name]);

	return (
		<div className="w-full flex flex-col gap-2">
			<AnimatePresence mode="wait">
				{tournament.isComplete && tournament.names !== null ? (
					<TournamentCompleteUI />
				) : (
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
