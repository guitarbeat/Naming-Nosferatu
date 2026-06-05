import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { useEffect, useRef } from "react";
import { CatConfetti } from "@/shared/components/layout/Feedback/CatConfetti";
import { AudioEffects } from "@/shared/lib/sound";
import { ratingsAPI } from "@/shared/services/supabase/ratingService";
import useAppStore from "@/store/appStore";
import { NameSelector } from "../components/NameSelector";

export default function TournamentFlow() {
	const { user, tournament, tournamentActions } = useAppStore();

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
					const rating = typeof ratingData === "number" ? ratingData : ratingData.rating;
					const wins = typeof ratingData === "number" ? 0 : (ratingData.wins ?? 0);
					const losses = typeof ratingData === "number" ? 0 : (ratingData.losses ?? 0);
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
				.then((result) => {
					if (result?.success) {
						console.log(`Successfully saved ${result.count} ratings to database`);
					}
				})
				.catch((_error) => {
					console.warn("Tournament ratings save failed — ratings were not persisted");
				});
		}
	}, [tournament.isComplete, tournament.ratings, user.name]);

	return (
		<div className="w-full flex flex-col gap-2">
			<AnimatePresence mode="wait">
				{tournament.isComplete && tournament.names !== null ? (
					<>
						<CatConfetti />
						<motion.div
							key="complete"
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.95 }}
							className="w-full flex justify-center py-6 sm:py-10"
						>
							<div className="w-full max-w-2xl text-center px-4 sm:px-6">
								<h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent uppercase tracking-tighter">
									A victor emerges from the eternal tournament
								</h2>
								<div className="flex justify-center mb-6 sm:mb-8">
									<div className="p-4 sm:p-6 bg-primary/10 rounded-full border border-primary/20">
										<Trophy className="size-12 sm:size-14 text-primary" />
									</div>
								</div>
								<p className="text-base sm:text-lg text-muted-foreground mb-8 sm:mb-10">
									Your personal rankings have been updated. Head over to the{" "}
									<strong className="text-primary">Analyze</strong> section to see the full
									breakdown and compare results!
								</p>
								<div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
									<button
										type="button"
										onClick={() =>
											document
												.getElementById("analysis")
												?.scrollIntoView({ behavior: "smooth", block: "start" })
										}
										className="w-full sm:w-auto px-6 py-3 bg-primary hover:bg-primary/90 rounded-lg font-semibold transition-all duration-200 active:scale-[0.98]"
									>
										See Results
									</button>
									<button
										type="button"
										onClick={() => tournamentActions.resetTournament()}
										className="w-full sm:w-auto px-6 py-3 bg-secondary hover:bg-secondary/80 rounded-lg font-semibold transition-all duration-200 active:scale-[0.98]"
									>
										Pick Different Names
									</button>
								</div>
							</div>
						</motion.div>
					</>
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
