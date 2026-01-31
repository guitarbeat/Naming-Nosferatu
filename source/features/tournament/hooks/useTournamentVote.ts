import { useCallback, useRef } from "react";
import type { Match } from "@/types/appTypes";
import { TOURNAMENT_TIMING } from "@/utils/constants";

/* =========================================================================
   VOTING LOGIC HOOK
   ========================================================================= */

export function useTournamentVote({
	isProcessing,
	isTransitioning,
	isError,
	currentMatch,
	handleVote,
	onVote,
	audioManager,
	setIsProcessing,
	setIsTransitioning,
	setSelectedOption,
	setVotingError,
}: {
	isProcessing: boolean;
	isTransitioning: boolean;
	isError?: boolean;
	currentMatch: Match | null;
	handleVote: (
		option: "left" | "right" | "both" | "neither",
	) => Promise<Record<string, { rating: number; wins?: number; losses?: number }> | undefined>;
	onVote?: (data: {
		match: {
			left: {
				name: string;
				id: string | number | null;
				description: string;
				outcome: "win" | "loss";
			};
			right: {
				name: string;
				id: string | number | null;
				description: string;
				outcome: "win" | "loss";
			};
		};
		result: number;
		timestamp: string;
		ratings: Record<string, number>;
	}) => Promise<void> | void;
	audioManager: { playAudioTrack: () => void };
	setIsProcessing: (val: boolean) => void;
	setIsTransitioning: (val: boolean) => void;
	setSelectedOption: (val: "left" | "right" | "both" | "neither" | null) => void;
	setVotingError: (err: unknown) => void;
	setLastMatchResult?: (val: string | null) => void;
	setShowMatchResult?: (val: boolean) => void;
	showSuccess?: (val: string) => void;
	showError?: (val: string) => void;
}) {
	const lastVoteTimeRef = useRef(0);

	const handleVoteWithAnimation = useCallback(
		async (option: "left" | "right" | "both" | "neither") => {
			if (
				isProcessing ||
				isTransitioning ||
				isError ||
				Date.now() - lastVoteTimeRef.current < TOURNAMENT_TIMING.VOTE_COOLDOWN
			) {
				return;
			}
			lastVoteTimeRef.current = Date.now();
			try {
				setIsProcessing(true);
				setIsTransitioning(true);
				audioManager.playAudioTrack();

				const rawRatings = await handleVote(option);
				if (!rawRatings) {
					setIsProcessing(false);
					setIsTransitioning(false);
					return;
				}

				if (onVote && currentMatch) {
					await onVote({
						match: {
							left: {
								name:
									typeof currentMatch.left === "string"
										? currentMatch.left
										: currentMatch.left?.name || "",
								id: (typeof currentMatch.left !== "string" && currentMatch.left?.id) || null,
								description:
									(typeof currentMatch.left !== "string" && currentMatch.left?.description) || "",
								outcome: option === "left" || option === "both" ? "win" : "loss",
							},
							right: {
								name:
									typeof currentMatch.right === "string"
										? currentMatch.right
										: currentMatch.right?.name || "",
								id: (typeof currentMatch.right !== "string" && currentMatch.right?.id) || null,
								description:
									(typeof currentMatch.right !== "string" && currentMatch.right?.description) || "",
								outcome: option === "right" || option === "both" ? "win" : "loss",
							},
						},
						result: option === "left" ? -1 : option === "right" ? 1 : 0.5,
						ratings: Object.fromEntries(
							Object.entries(rawRatings).map(([name, data]) => [name, data.rating]),
						),
						timestamp: new Date().toISOString(),
					});
				}

				setSelectedOption(null);
				setTimeout(() => {
					setIsProcessing(false);
					setIsTransitioning(false);
				}, 800);
			} catch (e) {
				setIsProcessing(false);
				setIsTransitioning(false);
				setVotingError(e);
			}
		},
		[
			isProcessing,
			isTransitioning,
			isError,
			handleVote,
			audioManager,
			onVote,
			currentMatch,
			setIsProcessing,
			setIsTransitioning,
			setSelectedOption,
			setVotingError,
		],
	);

	return { handleVoteWithAnimation };
}
