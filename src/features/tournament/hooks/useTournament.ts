import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocalStorage } from "@/hooks/useHooks";
import { calculateBracketRound, EloRating, PreferenceSorter } from "@/services/tournament";
import useAppStore from "@/store/appStore";
import type {
	Match,
	MatchRecord,
	NameItem,
	PersistentTournamentState,
	TournamentUIState,
} from "@/types/appTypes";

export interface TournamentResult {
	name: string;
	rating: number;
	wins?: number;
	losses?: number;
}

export interface UseTournamentProps {
	names?: NameItem[];
	existingRatings?: Record<string, { rating: number; wins?: number; losses?: number }>;
	onComplete?: (results: TournamentResult[]) => void;
}

// Utility functions within useTournament file (or can be moved to logic)
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

const createDefaultPersistentState = (userName: string): PersistentTournamentState => ({
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

	const [persistentStateRaw, setPersistentState] = useLocalStorage<PersistentTournamentState>(
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
		(
			updates:
				| Partial<PersistentTournamentState>
				| ((prev: PersistentTournamentState) => Partial<PersistentTournamentState>),
		) => {
			setPersistentState((prev: PersistentTournamentState) => {
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
			option: "left" | "right" | "both" | "neither",
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

			// Map option to winner/loser
			if (option === "left") {
				winnerName = leftName;
				loserName = rightName;
			} else if (option === "right") {
				winnerName = rightName;
				loserName = leftName;
			}
			// For both/neither, winnerName/loserName remain null which is handled below

			const currentStoreRatings = useAppStore.getState().tournament.ratings;
			const newRatings = { ...currentStoreRatings };

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

				// Map option to elo outcome
				// left -> "left", right -> "right", both -> "both", neither -> "none"
				const outcome: string =
					option === "both"
						? "both"
						: option === "neither"
							? "none"
							: option === "left"
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
				} else if (option === "both" || option === "neither") {
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
				voteType: option,
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
