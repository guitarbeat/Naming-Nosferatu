// Consolidated imports from all merged files
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	buildComparisonsMap,
	calculateBracketRound,
	EloRating,
	getPreferencesMap,
	initializeSorterPairs,
	PreferenceSorter,
} from "../../features/tournament/tournamentUtils";
import { ErrorManager } from "../../shared/services/errorManager";
import { tournamentsAPI } from "../../shared/services/supabase/client";
import {
	clearTournamentCache,
	devError,
	devLog,
	devWarn,
	isNameHidden,
	ratingsToArray,
	ratingsToObject,
} from "../../shared/utils";
import type {
	Match,
	MatchRecord,
	NameItem,
	PersistentState,
	TournamentState,
} from "../../types/components";
import type { AppState } from "../../types/store";
import useAppStore from "../store/useAppStore";
import useLocalStorage from "./useStorage";

// Types
export interface UseTournamentProps {
	names?: NameItem[];
	existingRatings?: Record<string, { rating: number; wins?: number; losses?: number }>;
	onComplete?: (
		results: Array<{
			name: string;
			id: string;
			rating: number;
			wins: number;
			losses: number;
		}>,
	) => void;
}

export interface UseTournamentHandlersProps {
	userName: string | null;
	tournamentActions: AppState["tournamentActions"];
	navigateTo: (path: string) => void;
}

// Utility functions

export function getNextMatch(
	names: NameItem[],
	sorter: unknown,
	_matchNumber: number,
	options: {
		currentRatings?: Record<string, { rating: number; wins?: number; losses?: number }>;
		history?: MatchRecord[];
	} = {},
): Match | null {
	if (!sorter || names.length <= 2) {
		return null;
	}

	const findBestMatch = () => {
		try {
			const nameList = names.filter((n) => n?.name);
			const s = sorter as PreferenceSorter;
			initializeSorterPairs(sorter, nameList);

			if (!Array.isArray(s.pairs) || s.pairs.length === 0) {
				return null;
			}

			const prefs = getPreferencesMap(sorter);
			const ratings = options.currentRatings || {};
			const history = options.history || [];
			const compHistory = history
				.filter((h) => h.winner && h.loser)
				.map((h) => ({
					winner: h.winner as string,
					loser: h.loser as string,
				}));
			const comparisons = buildComparisonsMap(compHistory);

			let bestPair: [string, string] | null = null;
			let bestScore = Infinity;
			const pairIndex = typeof s.currentIndex === "number" ? s.currentIndex : 0;

			for (let idx = pairIndex; idx < s.pairs.length; idx++) {
				const pair = s.pairs[idx];
				if (!pair || pair.length < 2) {
					continue;
				}
				const [a, b] = pair;
				if (prefs.has(`${a} -${b} `) || prefs.has(`${b} -${a} `)) {
					continue;
				}

				const ra =
					ratings[a]?.rating ||
					(typeof ratings[a] === "number" ? (ratings[a] as unknown as number) : 1500);
				const rb =
					ratings[b]?.rating ||
					(typeof ratings[b] === "number" ? (ratings[b] as unknown as number) : 1500);
				const diff = Math.abs(ra - rb);
				const ca = comparisons.get(a) || 0;
				const cb = comparisons.get(b) || 0;
				const uncScore = 1 / (1 + ca) + 1 / (1 + cb);
				const score = diff - 50 * uncScore;

				if (score < bestScore) {
					bestScore = score;
					bestPair = [a, b];
				}
			}

			if (bestPair) {
				const [a, b] = bestPair;
				s.currentIndex = Math.max(
					0,
					s.pairs.findIndex((p: [string, string]) => p[0] === a && p[1] === b),
				);
				return {
					left: names.find((n) => n?.name === a) || { name: a, id: a },
					right: names.find((n) => n?.name === b) || { name: b, id: b },
				} as Match;
			}
		} catch (e) {
			if (import.meta.env.DEV) {
				console.warn("Adaptive next-match selection failed:", e);
			}
		}
		return null;
	};

	if (options && (options.currentRatings || options.history)) {
		const match = findBestMatch();
		if (match) {
			return match;
		}
	}

	const s = sorter as PreferenceSorter;
	if (typeof s.getNextMatch === "function") {
		try {
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
	}

	return findBestMatch();
}

/**
 * Custom hook for tournament-related handlers
 * Extracts tournament logic from App component for better organization
 */
export function useTournamentHandlers({
	userName,
	tournamentActions,
	navigateTo,
}: UseTournamentHandlersProps) {
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
					devWarn("[App] Failed to save ratings to database:", saveResult.error);
					// We continue even if save fails, to show results locally
				}

				// * Update store with new ratings
				tournamentActions.setRatings(updatedRatings);
				tournamentActions.setComplete(true);

				devLog("[App] Tournament marked as complete, navigating to /results");

				// * Navigate to results page
				navigateTo("/results");
			} catch (error) {
				devError("[App] Error in handleTournamentComplete:", error);
				ErrorManager.handleError(error, "Tournament Completion", {
					isRetryable: true,
					affectsUserData: true,
					isCritical: false,
				});
			}
		},
		[userName, tournamentActions, navigateTo],
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
			// Ensure we are on the tournament view after starting
			tournamentActions.setView("tournament");

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
						devWarn("[App] Failed to auto-save ratings:", saveResult.error);
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
	const [tState, setTState] = useState<TournamentState>({
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
		(updates: Partial<TournamentState> | ((prev: TournamentState) => Partial<TournamentState>)) => {
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
			.map((name) => {
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
			.sort((a, b) => b.rating - a.rating);
	}, [names, currentRatings]);

	const handleVote = useCallback(
		(winner: string, voteType: string = "normal") => {
			if (tState.isTransitioning || tState.isError || !tState.currentMatch) {
				return;
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
				return;
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
			handleVote: () => {
				// Intentional no-op: error state, voting disabled
			},
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
