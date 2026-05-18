import { AnimatePresence, motion } from "framer-motion";
import useAppStore from "@/store/appStore";
import { NameSelector } from "../components/NameSelector";
import { TournamentFlowComplete } from "../components/TournamentFlowComplete";
import { useSaveTournamentRatings, useTournamentHandlers } from "../hooks";

export default function TournamentFlow() {
	const { user, tournament, tournamentActions } = useAppStore();
	const { handleStartNewTournament } = useTournamentHandlers({
		userName: user.name,
		tournamentActions,
	});
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
		if (tournament.isComplete && Object.keys(tournament.ratings).length > 0) {
			const userId = user.name || "anonymous";

                        ratingsAPI
                                .saveRatings(userName, ratingsSnapshot)
                                .then(async (result) => {
                                        if (!result?.success) {
                                                // Save failed (e.g. offline) — enqueue for later sync
                                                const records = Object.entries(ratingsSnapshot).map(([nameId, data]) => ({
                                                        name_id: nameId,
                                                        rating: data.rating,
                                                        wins: data.wins,
                                                        losses: data.losses,
                                                }));
                                                await enqueueRatingsMutation(records);
                                                console.warn("Ratings save failed; queued for offline sync");
                                        }
                                })
                                .catch(async (_error) => {
                                        // Network error — enqueue for later sync
                                        const records = Object.entries(ratingsSnapshot).map(([nameId, data]) => ({
                                                name_id: nameId,
                                                rating: data.rating,
                                                wins: data.wins,
                                                losses: data.losses,
                                        }));
                                        await enqueueRatingsMutation(records);
                                        console.warn("Tournament ratings save failed; queued for offline sync");
                                });
                }
        }, [tournament.isComplete, tournament.ratings, user.name]);

			for (const vote of tournament.voteHistory) {
				const winnerIds: string[] = Array.isArray((vote as Record<string, unknown>).winnerMemberIds)
					? ((vote as Record<string, unknown>).winnerMemberIds as string[])
					: [String(vote.winnerId)];
				const loserIds: string[] = Array.isArray((vote as Record<string, unknown>).loserMemberIds)
					? ((vote as Record<string, unknown>).loserMemberIds as string[])
					: [String(vote.loserId)];

				for (const id of winnerIds) {
					winsByName[id] = (winsByName[id] ?? 0) + 1;
				}
				for (const id of loserIds) {
					lossesByName[id] = (lossesByName[id] ?? 0) + 1;
				}
			}

			const ratingsWithStats: Record<string, { rating: number; wins: number; losses: number }> = {};
			for (const nameId in tournament.ratings) {
				const ratingData = tournament.ratings[nameId];
				const rating = typeof ratingData === "number" ? ratingData : ratingData.rating;
				ratingsWithStats[nameId] = {
					rating,
					wins: winsByName[nameId] ?? 0,
					losses: lossesByName[nameId] ?? 0,
				};
			}

			mutateAsyncRef
				.current({ userId, ratings: ratingsWithStats })
				.then((result) => {
					if (result?.success) {
						console.log(`Successfully saved ${result.count} ratings to database`);
					}
				})
				.catch((error) => {
					console.error("Failed to save tournament ratings:", error);
				});
		}
	}, [tournament.isComplete, tournament.ratings, user.name, tournament.voteHistory]);

	return (
		<div className="w-full flex flex-col gap-2">
			<AnimatePresence mode="wait">
				{tournament.isComplete && tournament.names !== null ? (
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
								<strong className="text-primary">Analyze</strong> section to see the full breakdown
								and compare results!
							</p>
							<div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
								<button
									onClick={() =>
										document
											.getElementById("analysis")
											?.scrollIntoView({ behavior: "smooth", block: "start" })
									}
									className="w-full sm:w-auto px-6 py-3 bg-primary hover:bg-primary/90 rounded-lg font-semibold transition-colors"
								>
									Analyze Results
								</button>
								<button
									onClick={handleStartNewTournament}
									className="w-full sm:w-auto px-6 py-3 bg-secondary hover:bg-secondary/80 rounded-lg font-semibold transition-colors"
								>
									Start New Tournament
								</button>
							</div>
						</div>
					</motion.div>
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
