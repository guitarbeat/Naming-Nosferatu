import { useEffect, useMemo, useState } from "react";
import type { NameItem } from "@/types/appTypes";
import { shuffleArray } from "@/utils/basic";
import { TOURNAMENT_TIMING } from "@/utils/constants";
import { useTournament } from "./useTournament";

/* =========================================================================
   CORE TOURNAMENT STATE HOOK
   ========================================================================= */

export function useTournamentState(
	names: NameItem[] | null | undefined,
	existingRatings:
		| Record<string, number | { rating: number; wins?: number; losses?: number }>
		| null
		| undefined,
	onComplete: (ratings: Record<string, { rating: number; wins?: number; losses?: number }>) => void,
	_onVote?: unknown,
) {
	const [randomizedNames, setRandomizedNames] = useState<NameItem[]>([]);
	const [selectedOption, setSelectedOption] = useState<
		"left" | "right" | "both" | "neither" | null
	>(null);
	const [isTransitioning, setIsTransitioning] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [lastMatchResult, setLastMatchResult] = useState<string | null>(null);
	const [showMatchResult, setShowMatchResult] = useState(false);

	const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
	const [showRoundTransition, setShowRoundTransition] = useState(false);
	const [nextRoundNumber, setNextRoundNumber] = useState<number | null>(null);
	const [votingError, setVotingError] = useState<unknown>(null);

	const namesIdentity = useMemo(
		() => (Array.isArray(names) ? names.map((n) => n.id || n.name).join(",") : ""),
		[names],
	);

	useEffect(() => {
		if (Array.isArray(names) && names.length > 0) {
			setRandomizedNames((prev) => {
				const prevIds = Array.isArray(prev) ? prev.map((n) => n.id || n.name).join(",") : "";
				return prevIds === namesIdentity ? prev : shuffleArray([...names]);
			});
		}
	}, [names, namesIdentity]);

	const convertedRatings = useMemo(
		() =>
			existingRatings
				? Object.fromEntries(
						Object.entries(existingRatings).map(([key, value]) => [
							key,
							typeof value === "number" ? { rating: value } : value,
						]),
					)
				: {},
		[existingRatings],
	);

	// Memoize names to prevent unnecessary re-initialization in useTournament
	const tournamentNames = useMemo(
		() =>
			randomizedNames.map((n) => ({
				id: String(n.id || n.name || ""),
				name: String(n.name || ""),
				description: n.description as string,
			})),
		[randomizedNames],
	);

	const tournament = useTournament({
		names: tournamentNames,
		existingRatings: convertedRatings as Record<
			string,
			{ rating: number; wins?: number; losses?: number }
		>,
		onComplete: (results) => {
			const ratings = Object.fromEntries(
				results.map((r) => [r.name, { rating: r.rating, wins: r.wins, losses: r.losses }]),
			);
			onComplete(ratings);
		},
	});

	useEffect(() => {
		if (tournament.roundNumber > 1) {
			setShowRoundTransition(true);
			setNextRoundNumber(tournament.roundNumber);
			const timer = setTimeout(() => {
				setShowRoundTransition(false);
				setNextRoundNumber(null);
			}, TOURNAMENT_TIMING.ROUND_TRANSITION_DELAY);
			return () => clearTimeout(timer);
		}
		return undefined;
	}, [tournament.roundNumber]);

	return {
		randomizedNames,
		selectedOption,
		setSelectedOption,
		isTransitioning,
		setIsTransitioning,
		isProcessing,
		setIsProcessing,
		lastMatchResult,
		setLastMatchResult,
		showMatchResult,
		setShowMatchResult,

		showKeyboardHelp,
		setShowKeyboardHelp,
		showRoundTransition,
		nextRoundNumber,
		votingError,
		setVotingError,

		handleVote: tournament.handleVote,
		tournament,
	};
}
