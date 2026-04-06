/**
 * @module TournamentFlow
 * @description Main tournament flow component - handles name selection and navigation
 */

import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/app/providers/Providers";
import { Trophy } from "@/shared/lib/icons";
import { ratingsAPI } from "@/shared/services/supabase/api";
import useAppStore from "@/store/appStore";
import { NameSelector } from "../components/NameSelector";
import { useTournamentHandlers } from "../hooks";

export default function TournamentFlow() {
        const { user, tournament, tournamentActions } = useAppStore();
        const navigate = useNavigate();
        const toast = useToast();
        const toastRef = useRef(toast);
        toastRef.current = toast;

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

        // Stable ref so the effect never re-runs just because the mutation object changed
        const mutateAsyncRef = useRef(saveRatingsMutation.mutateAsync);
        mutateAsyncRef.current = saveRatingsMutation.mutateAsync;

        // Guard: only save once per tournament completion; reset when a new tournament begins
        const hasSavedRef = useRef(false);

        useEffect(() => {
                if (!tournament.isComplete) {
                        hasSavedRef.current = false;
                        return;
                }
                if (hasSavedRef.current || Object.keys(tournament.ratings).length === 0) {
                        return;
                }

                hasSavedRef.current = true;
                const userId = user.name || "anonymous";

                // Compute per-name wins and losses from the vote history
                const winsByName: Record<string, number> = {};
                const lossesByName: Record<string, number> = {};

                // Check if this is a 2v2 tournament by seeing if vote IDs exist in ratings
                // For 2v2, vote IDs are team IDs (not in ratings); for 1v1, they're name IDs (in ratings)
                const nameIds = new Set(Object.keys(tournament.ratings));
                let is2v2Tournament = false;

                for (const vote of tournament.voteHistory) {
                        const wId = String(vote.winnerId);
                        const lId = String(vote.loserId);

                        // If neither vote ID is in the ratings, it's likely a 2v2 tournament
                        if (!nameIds.has(wId) && !nameIds.has(lId)) {
                                is2v2Tournament = true;
                                break;
                        }
                }

                // Only count wins/losses for 1v1 tournaments
                // For 2v2, we would need team membership data which is not available here
                if (!is2v2Tournament) {
                        for (const vote of tournament.voteHistory) {
                                const wId = String(vote.winnerId);
                                const lId = String(vote.loserId);
                                winsByName[wId] = (winsByName[wId] ?? 0) + 1;
                                lossesByName[lId] = (lossesByName[lId] ?? 0) + 1;
                        }
                }

                const ratingsWithStats = Object.entries(tournament.ratings).reduce(
                        (acc, [nameId, ratingData]) => {
                                const rating =
                                        typeof ratingData === "number" ? ratingData : ratingData.rating;
                                acc[nameId] = {
                                        rating,
                                        wins: winsByName[nameId] ?? 0,
                                        losses: lossesByName[nameId] ?? 0,
                                };
                                return acc;
                        },
                        {} as Record<string, { rating: number; wins: number; losses: number }>,
                );

                mutateAsyncRef.current({ userId, ratings: ratingsWithStats })
                        .then((result) => {
                                if (result?.success) {
                                        console.log(`Successfully saved ${result.count} ratings to database`);
                                }
                        })
                        .catch((_error) => {
                                console.warn("Tournament ratings save failed — ratings were not persisted");
                                toastRef.current.showWarning(
                                        "Your tournament results could not be saved to the database. Your local rankings are still intact, but they won't appear in the global leaderboard.",
                                );
                        });
        }, [tournament.isComplete, tournament.ratings, user.name]);

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
                                                                        onClick={() => navigate("/analysis")}
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
