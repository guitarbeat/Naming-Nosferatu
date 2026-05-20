import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { ratingsAPI } from "@/shared/services/supabase/ratingService";
import type { VoteRecord } from "@/shared/types";

interface UseSaveTournamentRatingsProps {
	isComplete: boolean;
	ratings: Record<string, number | { rating: number; wins: number; losses: number }>;
	userName: string;
	voteHistory: VoteRecord[];
}

export function useSaveTournamentRatings({
	isComplete,
	ratings,
	userName,
	voteHistory,
}: UseSaveTournamentRatingsProps) {
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
		if (isComplete && Object.keys(ratings).length > 0) {
			const userId = userName || "anonymous";

			// Compute per-name wins and losses from the vote history.
			// For 1v1, winnerId/loserId are direct name IDs.
			// For 2v2, winnerMemberIds/loserMemberIds expand team votes to individual names.
			const winsByName: Record<string, number> = {};
			const lossesByName: Record<string, number> = {};

			for (const vote of voteHistory) {
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

			const ratingsWithStats = Object.entries(ratings).reduce(
				(acc, [nameId, ratingData]) => {
					const rating = typeof ratingData === "number" ? ratingData : ratingData.rating;
					acc[nameId] = {
						rating,
						wins: winsByName[nameId] ?? 0,
						losses: lossesByName[nameId] ?? 0,
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
					// Error is already logged by ratingsAPI with context
					console.warn("Tournament ratings save failed — ratings were not persisted");
				});
		}
	}, [isComplete, ratings, userName, voteHistory]);
}
