import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TOURNAMENT_TIMING } from "@/constants";
import useLocalStorage from "@/hooks/useStorage";
import { ErrorManager } from "@/services/errorManager";
import useAppStore from "@/store/useAppStore";
import type {
	Match,
	MatchRecord,
	NameItem,
	PersistentState,
	TournamentUIState,
} from "@/types/components";
import type { AppState } from "@/types/store";
import {
	clearTournamentCache,
	devError,
	devLog,
	devWarn,
	isNameHidden,
	ratingsToArray,
	ratingsToObject,
	shuffleArray,
} from "@/utils";
import {
	calculateBracketRound,
	EloRating,
	PreferenceSorter,
	tournamentsAPI,
} from "./TournamentLogic";

/* =========================================================================
   TYPES
   ========================================================================= */

interface TournamentResult {
	name: string;
	rating: number;
	wins?: number;
	losses?: number;
}

interface UseTournamentProps {
	names?: NameItem[];
	existingRatings?: Record<string, { rating: number; wins?: number; losses?: number }>;
	onComplete?: (results: TournamentResult[]) => void;
}

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

	const tournament = useTournament({
		names: randomizedNames.map((n) => ({
			id: String(n.id || n.name || ""),
			name: String(n.name || ""),
			description: n.description as string,
		})),
		existingRatings: convertedRatings as Record<
			string,
			{ rating: number; wins?: number; losses?: number }
		>,
		onComplete: (results: TournamentResult[]) => {
			const ratings = Object.fromEntries(
				results.map((r: TournamentResult) => [
					r.name,
					{ rating: r.rating, wins: r.wins, losses: r.losses },
				]),
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
		handleVote: async (
			option: "left" | "right" | "both" | "neither",
		): Promise<Record<string, { rating: number; wins?: number; losses?: number }> | undefined> => {
			if (!tournament.handleVote) {
				return undefined;
			}
			const winnerMap = {
				left: "left",
				right: "right",
				both: "both",
				neither: "neither",
			};
			const typeMap = {
				left: "normal",
				right: "normal",
				both: "both",
				neither: "neither",
			};
			return tournament.handleVote(winnerMap[option], typeMap[option]);
		},
		tournament,
	};
}

/* =========================================================================
   INTERACTION HOOKS
   ========================================================================= */

export function useAudioManager() {
	const [isMuted, setIsMuted] = useState(true);
	const [volume, setVolume] = useState(0.2);
	return {
		playAudioTrack: () => {
			/* No-op: handled by external audio services if available */
		},
		isMuted,
		handleToggleMute: () => setIsMuted((p) => !p),
		handleNextTrack: () => {
			/* No-op: logic not implemented for simple tournaments */
		},
		isShuffle: false,
		handleToggleShuffle: () => {
			/* No-op: logic not implemented for simple tournaments */
		},
		currentTrack: null,
		trackInfo: null,
		audioError: null,
		retryAudio: () => {
			/* No-op: handled by external audio services if available */
		},
		volume,
		handleVolumeChange: (_unused: unknown, v: number) => setVolume(Math.min(1, Math.max(0, v))),
	};
}

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
						timestamp: new Date().toISOString(),
						ratings: {},
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

/* =========================================================================
   TOURNAMENT SETUP HOOKS
   ========================================================================= */

/* =========================================================================
   TYPES & UTILS
   ========================================================================= */

// Types

export interface UseTournamentHandlersProps {
	userName: string | null;
	tournamentActions: AppState["tournamentActions"];
}

// Utility functions

function getNextMatch(
	names: NameItem[],
	sorter: unknown,
	_matchNumber: number,
	_options: {
		currentRatings?: Record<string, { rating: number; wins?: number; losses?: number }>;
		history?: MatchRecord[];
	} = {},
): Match | null {
	if (!sorter || names.length <= 2) {
		return null;
	}

	const s = sorter as PreferenceSorter;

	// const ratings = options.currentRatings || {}; // Unused
	// const history = options.history || []; // Unused in this scope if comparisons logic is removed

	// const comparisons = buildComparisonsMap(compHistory); // Unused

	try {
		// Delegate to PreferenceSorter (now handles adaptive logic internally)
		const nm = s.getNextMatch();

		if (nm) {
			return {
				left: names.find((n) => n?.name === nm.left) || {
					name: nm.left,
					id: nm.left,
				},
				right: names.find((n) => n?.name === nm.right) || {
					name: nm.right,
					id: nm.right,
				},
			} as Match;
		}
	} catch (error) {
		if (import.meta.env.DEV) {
			console.warn("Could not get next match from sorter:", error);
		}
	}

	return null;
}

/**
 * Custom hook for tournament-related handlers
 * Extracts tournament logic from App component for better organization
 */
export function useTournamentHandlers({
	userName,
	tournamentActions,
}: Omit<UseTournamentHandlersProps, "navigateTo">) {
	/**
	 * Handles the completion of a tournament.
	 * Saves ratings, updates state, and navigates to results.
	 */
	const handleTournamentComplete = useCallback(
		async (finalRatings: Record<string, { rating: number; wins?: number; losses?: number }>) => {
			try {
				devLog("[App] handleTournamentComplete called with:", finalRatings);

				if (!userName) {
					throw new Error("No user name available for saving results");
				}

				// * Convert ratings using utility functions
				const ratingsArray = ratingsToArray(finalRatings);
				const updatedRatings = ratingsToObject(ratingsArray);

				devLog("[App] Ratings to save:", ratingsArray);

				// * Save ratings to database
				const saveResult = await tournamentsAPI.saveTournamentRatings(userName, ratingsArray);

				devLog("[App] Save ratings result:", saveResult);

				if (!saveResult.success) {
					devWarn(
						"[App] Failed to save ratings to database:",
						(saveResult as { error?: string }).error,
					);
					// We continue even if save fails, to show results locally
				}

				// * Update store with new ratings
				tournamentActions.setRatings(updatedRatings);
				tournamentActions.setComplete(true);

				devLog("[App] Tournament marked as complete, scrolling to analysis");

				// * Scroll to analysis section
				const analyzeElement = document.getElementById("analysis");
				if (analyzeElement) {
					analyzeElement.scrollIntoView({ behavior: "smooth" });
				}
			} catch (error) {
				devError("[App] Error in handleTournamentComplete:", error);
				ErrorManager.handleError(error, "Tournament Completion", {
					isRetryable: true,
					affectsUserData: true,
					isCritical: false,
				});
			}
		},
		[userName, tournamentActions],
	);

	/**
	 * Resets the tournament state to start a new one.
	 */
	const handleStartNewTournament = useCallback(() => {
		tournamentActions.resetTournament();
	}, [tournamentActions]);

	/**
	 * Sets up the tournament with the provided names.
	 * Filters hidden names and initializes state.
	 */
	const handleTournamentSetup = useCallback(
		(names: NameItem[] | undefined) => {
			// * Clear tournament cache to ensure fresh data
			clearTournamentCache();

			// * Reset tournament state and set loading
			tournamentActions.resetTournament();
			tournamentActions.setLoading(true);

			// * Filter out hidden names before starting tournament
			const processedNames = Array.isArray(names)
				? names.filter((name) => !isNameHidden(name))
				: [];

			if (processedNames.length === 0) {
				devWarn("[App] No visible names available after filtering hidden names");
				tournamentActions.setLoading(false);
				return;
			}

			tournamentActions.setNames(processedNames);

			// * Use setTimeout to ensure the loading state is visible and prevent flashing
			setTimeout(() => {
				tournamentActions.setLoading(false);
			}, 100);
		},
		[tournamentActions],
	);

	/**
	 * Updates ratings during the tournament (e.g. after each match).
	 */
	const handleUpdateRatings = useCallback(
		async (adjustedRatings: Record<string, { rating: number; wins?: number; losses?: number }>) => {
			try {
				// * Convert ratings using utility functions
				const ratingsArray = ratingsToArray(adjustedRatings);

				// * Save ratings to database
				if (userName) {
					const saveResult = await tournamentsAPI.saveTournamentRatings(userName, ratingsArray);

					if (saveResult.success) {
						devLog("[App] Update ratings result:", saveResult);
					} else {
						devWarn("[App] Failed to auto-save ratings:", (saveResult as { error?: string }).error);
					}
				}

				// * Convert to object format for store
				const updatedRatings = ratingsToObject(ratingsArray);

				tournamentActions.setRatings(updatedRatings);
				return true;
			} catch (error) {
				// Log but don't crash the app for auto-save errors
				devError("[App] Error in handleUpdateRatings:", error);
				ErrorManager.handleError(error, "Rating Update", {
					isRetryable: true,
					affectsUserData: true,
					isCritical: false,
				});
				throw error;
			}
		},
		[tournamentActions, userName],
	);

	return {
		handleTournamentComplete,
		handleStartNewTournament,
		handleTournamentSetup,
		handleUpdateRatings,
	};
}

// useTournament function - uses imports from top of file

const createDefaultPersistentState = (userName: string): PersistentState => ({
	matchHistory: [],
	currentRound: 1,
	currentMatch: 1,
	totalMatches: 0,
	userName: userName || "anonymous",
	lastUpdated: Date.now(),
	namesKey: "",
});

/**
 * Custom hook for managing tournament state and logic
 * Consolidates persistence, progress, and voting logic.
 */
export function useTournament({
	names = [],
	existingRatings = {},
	onComplete,
}: UseTournamentProps = {}) {
	// --- Setup ---
	const elo = useMemo(() => new EloRating(), []);
	const userName = useAppStore((state) => state.user.name);
	const tournament = useAppStore((state) => state.tournament);
	const { ratings: currentRatings } = tournament;
	const { tournamentActions } = useAppStore();

	// --- Persistence ---
	const tournamentId = useMemo(() => {
		const sortedNames = [...names]
			.map((n: NameItem) => n.name || n)
			.sort()
			.join("-");
		const prefix = userName || "anonymous";
		return `tournament-${prefix}-${sortedNames}`;
	}, [names, userName]);

	const defaultPersistentState = useMemo(() => createDefaultPersistentState(userName), [userName]);

	const [persistentStateRaw, setPersistentState] = useLocalStorage<PersistentState>(
		tournamentId,
		defaultPersistentState,
	);

	// Safety wrapper for persistentState
	const persistentState = useMemo(() => {
		if (
			!persistentStateRaw ||
			typeof persistentStateRaw !== "object" ||
			Array.isArray(persistentStateRaw)
		) {
			return createDefaultPersistentState(userName);
		}
		return {
			...createDefaultPersistentState(userName),
			...persistentStateRaw,
			matchHistory: Array.isArray(persistentStateRaw.matchHistory)
				? persistentStateRaw.matchHistory
				: [],
		};
	}, [persistentStateRaw, userName]);

	const updatePersistentState = useCallback(
		(updates: Partial<PersistentState> | ((prev: PersistentState) => Partial<PersistentState>)) => {
			setPersistentState((prev: PersistentState) => {
				const delta = typeof updates === "function" ? updates(prev) || {} : updates || {};
				return {
					...prev,
					...delta,
					lastUpdated: Date.now(),
					userName: userName || "anonymous",
				};
			});
		},
		[setPersistentState, userName],
	);

	useEffect(() => {
		if (persistentState && persistentState.userName !== (userName || "anonymous")) {
			updatePersistentState({
				matchHistory: [],
				currentRound: 1,
				currentMatch: 1,
				totalMatches: 0,
				userName: userName || "anonymous",
				namesKey: "",
			});
		}
	}, [persistentState, updatePersistentState, userName]);

	// --- Intermediate State ---
	const [tState, setTState] = useState<TournamentUIState>({
		currentMatch: null,
		isTransitioning: false,
		roundNumber: persistentState.currentRound || 1,
		currentMatchNumber: persistentState.currentMatch || 1,
		totalMatches: persistentState.totalMatches || 0,
		canUndo: persistentState.matchHistory.length > 1,
		currentRatings: existingRatings,
		sorter: null,
		isError: !Array.isArray(names) || (names.length > 0 && names.length < 2),
	});

	const updateTournamentState = useCallback(
		(
			updates:
				| Partial<TournamentUIState>
				| ((prev: TournamentUIState) => Partial<TournamentUIState>),
		) => {
			setTState((prev) => {
				const delta = typeof updates === "function" ? updates(prev) : updates;
				return { ...prev, ...delta };
			});
		},
		[],
	);

	const lastInitKeyRef = useRef("");

	// Initialize tournament when names change
	useEffect(() => {
		if (!Array.isArray(names) || names.length < 2) {
			return;
		}

		const namesKey = names
			.map((n) => n?.id || n?.name || "")
			.filter(Boolean)
			.sort()
			.join(",");
		if (lastInitKeyRef.current === namesKey) {
			return;
		}

		lastInitKeyRef.current = namesKey;
		const nameStrings = names.map((n) => n?.name || "").filter(Boolean);
		const newSorter = new PreferenceSorter(nameStrings);
		const estimatedMatches = names.length > 1 ? names.length - 1 : 0;

		updateTournamentState({
			sorter: newSorter,
			totalMatches: estimatedMatches,
			currentMatchNumber: 1,
			roundNumber: 1,
			canUndo: false,
			currentRatings: existingRatings,
		});

		updatePersistentState({
			matchHistory: [],
			currentRound: 1,
			currentMatch: 1,
			totalMatches: estimatedMatches,
			namesKey,
		});

		const first = getNextMatch(names, newSorter, 1, {
			currentRatings: existingRatings,
			history: [],
		});
		if (first) {
			updateTournamentState({ currentMatch: first });
		} else if (names.length >= 2) {
			const left = names[0];
			const right = names[1];
			if (left && right) {
				updateTournamentState({
					currentMatch: { left, right },
				});
			}
		}
	}, [names, existingRatings, updateTournamentState, updatePersistentState]);

	// --- Voting Logic ---
	const getCurrentRatings = useCallback(() => {
		if (!names || names.length === 0) {
			return [];
		}
		return names
			.map((name: NameItem) => {
				const nameStr = name.name;
				const rating = currentRatings?.[nameStr] || {
					rating: 1500,
					wins: 0,
					losses: 0,
				};
				return {
					name: nameStr,
					id: String(name?.id || nameStr),
					rating: typeof rating === "number" ? rating : rating.rating || 1500,
					wins: rating.wins || 0,
					losses: rating.losses || 0,
				};
			})
			.sort((a: TournamentResult, b: TournamentResult) => b.rating - a.rating);
	}, [names, currentRatings]);

	const handleVote = useCallback(
		async (
			winner: string,
			voteType: string = "normal",
		): Promise<Record<string, { rating: number; wins?: number; losses?: number }> | undefined> => {
			if (tState.isTransitioning || tState.isError || !tState.currentMatch) {
				return undefined;
			}

			updateTournamentState({ isTransitioning: true });

			const leftName =
				(tState.currentMatch.left as NameItem)?.name || (tState.currentMatch.left as string);
			const rightName =
				(tState.currentMatch.right as NameItem)?.name || (tState.currentMatch.right as string);

			let winnerName: string | null = null;
			let loserName: string | null = null;

			if (voteType === "left") {
				winnerName = leftName;
				loserName = rightName;
			} else if (voteType === "right") {
				winnerName = rightName;
				loserName = leftName;
			} else if (winner === "left") {
				winnerName = leftName;
				loserName = rightName;
			} else if (winner === "right") {
				winnerName = rightName;
				loserName = leftName;
			}

			const newRatings = { ...currentRatings };
			if (elo) {
				const leftRating = newRatings[leftName]?.rating || 1500;
				const rightRating = newRatings[rightName]?.rating || 1500;
				const leftStats = {
					winsA: newRatings[leftName]?.wins || 0,
					lossesA: newRatings[leftName]?.losses || 0,
				};
				const rightStats = {
					winsB: newRatings[rightName]?.wins || 0,
					lossesB: newRatings[rightName]?.losses || 0,
				};

				const outcome: string =
					voteType === "both"
						? "both"
						: voteType === "neither"
							? "none"
							: winner === "left" || voteType === "left"
								? "left"
								: "right";

				const r = elo.calculateNewRatings(leftRating, rightRating, outcome, {
					...leftStats,
					...rightStats,
				});

				newRatings[leftName] = {
					...newRatings[leftName],
					rating: r.newRatingA,
					wins: r.winsA,
					losses: r.lossesA,
				};
				newRatings[rightName] = {
					...newRatings[rightName],
					rating: r.newRatingB,
					wins: r.winsB,
					losses: r.lossesB,
				};
			}

			if (tState.sorter) {
				const s = tState.sorter as PreferenceSorter;
				if (winnerName && loserName) {
					if (typeof s.addPreference === "function") {
						s.addPreference(winnerName, loserName, 1);
					} else if (s.preferences instanceof Map) {
						s.preferences.set(`${winnerName}-${loserName}`, 1);
					}
				} else if (voteType === "both" || voteType === "neither") {
					if (typeof s.addPreference === "function") {
						s.addPreference(leftName, rightName, 0);
						s.addPreference(rightName, leftName, 0);
					} else if (s.preferences instanceof Map) {
						s.preferences.set(`${leftName}-${rightName}`, 0);
						s.preferences.set(`${rightName}-${leftName}`, 0);
					}
				}
			}

			const matchRecord: MatchRecord = {
				match: tState.currentMatch,
				winner: winnerName,
				loser: loserName,
				voteType,
				matchNumber: tState.currentMatchNumber,
				roundNumber: tState.roundNumber,
				timestamp: Date.now(),
			};

			const nextMatchNumber = tState.currentMatchNumber + 1;
			updatePersistentState({
				matchHistory: [...(persistentState.matchHistory || []), matchRecord],
				currentMatch: nextMatchNumber,
			});

			if (tournamentActions?.setRatings) {
				tournamentActions.setRatings(newRatings);
			}
			updateTournamentState({ currentRatings: newRatings, canUndo: true });

			if (nextMatchNumber > tState.totalMatches) {
				setTimeout(() => {
					updateTournamentState({ isTransitioning: false });
					if (onComplete) {
						onComplete(getCurrentRatings());
					}
				}, 300);
				return newRatings;
			}

			const nextMatch = getNextMatch(names, tState.sorter, nextMatchNumber, {
				currentRatings: newRatings,
				history: [...(persistentState.matchHistory || []), matchRecord],
			});

			const newRoundNumber = calculateBracketRound(names.length, nextMatchNumber);
			setTimeout(() => {
				updateTournamentState({
					currentMatch: nextMatch || null,
					currentMatchNumber: nextMatchNumber,
					roundNumber: newRoundNumber,
					isTransitioning: false,
				});
				if (newRoundNumber !== tState.roundNumber) {
					updatePersistentState({ currentRound: newRoundNumber });
				}
			}, 300);

			return newRatings;
		},
		[
			tState,
			currentRatings,
			elo,
			tournamentActions,
			updatePersistentState,
			updateTournamentState,
			names,
			onComplete,
			getCurrentRatings,
			persistentState.matchHistory,
		],
	);

	// --- Progress Logic ---
	const handleUndo = useCallback(() => {
		if (tState.isTransitioning || !tState.canUndo || persistentState.matchHistory.length === 0) {
			return;
		}

		updateTournamentState({ isTransitioning: true });
		const history = persistentState.matchHistory;
		const lastVote = history[history.length - 1];
		if (!lastVote || !lastVote.match) {
			updateTournamentState({ isTransitioning: false });
			return;
		}

		updateTournamentState({
			currentMatch: lastVote.match,
			currentMatchNumber: lastVote.matchNumber || 1,
		});

		const newHistory = history.slice(0, -1);
		updatePersistentState({ matchHistory: newHistory });

		const s = tState.sorter as PreferenceSorter;
		if (s) {
			if (typeof s.undoLastPreference === "function") {
				s.undoLastPreference();
			} else if (s.preferences instanceof Map) {
				const ln = (lastVote.match.left as NameItem)?.name || (lastVote.match.left as string);
				const rn = (lastVote.match.right as NameItem)?.name || (lastVote.match.right as string);
				if (ln && rn) {
					s.preferences.delete(`${ln}-${rn}`);
					s.preferences.delete(`${rn}-${ln}`);
					if (typeof s.currentIndex === "number") {
						s.currentIndex = Math.max(0, s.currentIndex - 1);
					}
				}
			}
		}

		if (names.length >= 2 && newHistory.length > 0) {
			const prevMatchNumber =
				newHistory[newHistory.length - 1]?.matchNumber || tState.currentMatchNumber;
			const calcRound = calculateBracketRound(names.length, prevMatchNumber);
			if (calcRound !== tState.roundNumber) {
				updateTournamentState({ roundNumber: calcRound });
				updatePersistentState({ currentRound: calcRound });
			}
		} else if (newHistory.length === 0) {
			updateTournamentState({ roundNumber: 1 });
			updatePersistentState({ currentRound: 1 });
		}

		updateTournamentState({ canUndo: newHistory.length > 0 });
		setTimeout(() => updateTournamentState({ isTransitioning: false }), 500);
	}, [
		tState,
		persistentState.matchHistory,
		updateTournamentState,
		updatePersistentState,
		names.length,
	]);

	const progressValue = useMemo(() => {
		if (!tState.totalMatches) {
			return 0;
		}
		return Math.round((tState.currentMatchNumber / tState.totalMatches) * 100);
	}, [tState.currentMatchNumber, tState.totalMatches]);

	// --- Return ---
	if (tState.isError) {
		return {
			currentMatch: null,
			handleVote: async () => undefined,
			progress: 0,
			roundNumber: 0,
			currentMatchNumber: 0,
			totalMatches: 0,
			matchHistory: [],
			getCurrentRatings: () => [],
			isError: true,
			userName: persistentState.userName,
		};
	}

	return {
		currentMatch: tState.currentMatch,
		isTransitioning: tState.isTransitioning,
		roundNumber: tState.roundNumber,
		currentMatchNumber: tState.currentMatchNumber,
		totalMatches: tState.totalMatches,
		progress: progressValue,
		handleVote,
		handleUndo,
		canUndo: tState.canUndo,
		getCurrentRatings,
		isError: tState.isError,
		matchHistory: persistentState.matchHistory,
		userName: persistentState.userName,
	};
}
