/**
 * @module useTournamentState
 * @description Custom hook for managing tournament UI state and interactions.
 * Handles randomized names, selected options, transitions, and UI visibility states.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { TOURNAMENT_TIMING } from "../../../core/constants";
import { useTournament } from "../../../core/hooks/useTournament";

/**
 * Custom hook for tournament state management
 * @param {Array} names - Array of names for the tournament
 * @param {Object} existingRatings - Existing ratings for names
 * @param {Function} onComplete - Callback when tournament completes
 * @param {Function} _onVote - Vote callback (unused but kept for API compatibility)
 * @returns {Object} Tournament state and handlers
 */
interface NameItem {
	id?: string | number;
	name?: string;
	[key: string]: unknown;
}

// ts-prune-ignore-next (used in Tournament)
export function useTournamentState(
	names: NameItem[] | null | undefined,
	existingRatings: Record<string, number> | null | undefined,
	onComplete: (ratings: Record<string, number>) => void,
	_onVote: (winner: NameItem, loser: NameItem) => void,
) {
	const [randomizedNames, setRandomizedNames] = useState<NameItem[]>([]);
	const [selectedOption, setSelectedOption] = useState<
		"left" | "right" | "both" | "neither" | null
	>(null);
	const [isTransitioning, setIsTransitioning] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [lastMatchResult, setLastMatchResult] = useState<string | null>(null);
	const [showMatchResult, setShowMatchResult] = useState<boolean>(false);
	const [showBracket, setShowBracket] = useState<boolean>(false);
	const [showKeyboardHelp, setShowKeyboardHelp] = useState<boolean>(false);
	const [showRoundTransition, setShowRoundTransition] =
		useState<boolean>(false);
	const [nextRoundNumber, setNextRoundNumber] = useState<number | null>(null);
	const [votingError, setVotingError] = useState<unknown>(null);

	const tournamentStateRef = useRef({ isActive: false });

	// * Set up randomized names
	// Shuffle only when the identity set (ids) changes, not on shallow changes
	const namesIdentity = useMemo(
		() =>
			Array.isArray(names) ? names.map((n) => n.id || n.name).join(",") : "",
		[names],
	);
	useEffect(() => {
		if (Array.isArray(names) && names.length > 0) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setRandomizedNames((prev) => {
				const prevIds = Array.isArray(prev)
					? prev.map((n) => n.id || n.name).join(",")
					: "";
				if (prevIds === namesIdentity) return prev; // no reshuffle
				return shuffleArray([...names]);
			});
		}
	}, [names, namesIdentity]);

	// * Tournament hook
	// Convert NameItem[] to Name[] and Record<string, number> to Record<string, { rating: number; wins?: number; losses?: number }>
	const convertedNames: Array<{
		id: string;
		name: string;
		description?: string;
	}> = randomizedNames.map((n) => ({
		id: String(n.id || n.name || ""),
		name: String(n.name || ""),
		description: n.description as string | undefined, // Pass description through
	}));
	const convertedRatings: Record<
		string,
		{ rating: number; wins?: number; losses?: number }
	> = existingRatings
		? Object.fromEntries(
				Object.entries(existingRatings).map(([key, value]) => [
					key,
					typeof value === "number" ? { rating: value } : value,
				]),
			)
		: {};
	const convertedOnComplete = onComplete
		? (
				results: Array<{
					name: string;
					id: string;
					rating: number;
					wins: number;
					losses: number;
				}>,
			) => {
				const ratings = Object.fromEntries(
					results.map((r) => [r.id, r.rating]),
				);
				onComplete(ratings);
			}
		: undefined;

	const tournament = useTournament({
		names: convertedNames,
		existingRatings: convertedRatings,
		onComplete: convertedOnComplete,
	});

	// * Reset state on error
	useEffect(() => {
		if (tournament.isError) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setSelectedOption(null);

			setIsTransitioning(false);

			setIsProcessing(false);
			tournamentStateRef.current.isActive = false;
		}
	}, [tournament.isError]);

	// * Track tournament state
	useEffect(() => {
		if (tournament.currentMatch) {
			tournamentStateRef.current.isActive = true;
		}
	}, [tournament.currentMatch]);

	// * Round transition effect
	useEffect(() => {
		if (tournament.roundNumber > 1) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setShowRoundTransition(true);

			setNextRoundNumber(tournament.roundNumber);

			const timer = setTimeout(() => {
				setShowRoundTransition(false);
				setNextRoundNumber(null);
			}, TOURNAMENT_TIMING.ROUND_TRANSITION_DELAY);

			return () => clearTimeout(timer);
		}
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
		showBracket,
		setShowBracket,
		showKeyboardHelp,
		setShowKeyboardHelp,
		showRoundTransition,
		nextRoundNumber,
		votingError,
		setVotingError,
		tournament,
	};
}
