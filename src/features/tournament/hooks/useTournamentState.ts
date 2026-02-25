import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EloRating, PreferenceSorter } from "@/services/tournament";
import { useLocalStorage } from "@/shared/hooks";
import type { Match, MatchRecord, NameItem } from "@/shared/types";
import { useToast } from "@/app/providers/Providers";
import { useAudioManager } from "./useHelpers";

export interface UseTournamentStateResult {
        currentMatch: Match | null;
        ratings: Record<string, number>;
        round: number;
        matchNumber: number;
        totalMatches: number;
        isComplete: boolean;
        handleVote: (winnerId: string, loserId: string) => void;
        handleUndo: () => void;
        canUndo: boolean;
        handleQuit?: () => void;
        progress?: number;
        etaMinutes?: number;
        isVoting: boolean;
        handleVoteWithAnimation: (winnerId: string, loserId: string) => void;
}

const VOTE_COOLDOWN = 300;

interface HistoryEntry {
        match: Match;
        ratings: Record<string, number>;
        round: number;
        matchNumber: number;
}

interface PersistentTournamentState {
	matchHistory: MatchRecord[];
	currentRound: number;
	currentMatch: number;
	totalMatches: number;
	userName: string;
	lastUpdated: number;
	namesKey: string;
	ratings: Record<string, number>;
}

function createDefaultPersistentState(userName: string): PersistentTournamentState {
	return {
		matchHistory: [],
		currentRound: 1,
		currentMatch: 1,
		totalMatches: 0,
		userName: userName || "anonymous",
		lastUpdated: Date.now(),
		namesKey: "",
		ratings: {},
	};
}

export function useTournamentState(names: NameItem[], userName?: string): UseTournamentStateResult {
	// --- Persistence setup ---
	const tournamentId = useMemo(() => {
		const sortedNames = names
			.map((n) => n.name || n)
			.sort()
			.join("-");
		const prefix = userName || "anonymous";
		return `tournament-${prefix}-${sortedNames}`;
	}, [names, userName]);

	const defaultPersistentState = useMemo(
		() => createDefaultPersistentState(userName || "anonymous"),
		[userName],
	);

	const [persistentStateRaw, setPersistentState] = useLocalStorage<PersistentTournamentState>(
		tournamentId,
		defaultPersistentState,
		{ debounceWait: 1000 },
	);

	const persistentState = useMemo(() => {
		if (
			!persistentStateRaw ||
			typeof persistentStateRaw !== "object" ||
			Array.isArray(persistentStateRaw)
		) {
			return createDefaultPersistentState(userName || "anonymous");
		}
		return {
			...createDefaultPersistentState(userName || "anonymous"),
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
			setPersistentState((prev) => {
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

	// Memoize names key to prevent unnecessary re-initializations
	const namesKey = useMemo(
		() =>
			names
				.map((n) => n?.id || n?.name || "")
				.filter(Boolean)
				.sort()
				.join(","),
		[names],
	);

	// --- State initialization ---
	const [ratings, setRatings] = useState<Record<string, number>>({});
	const [history, setHistory] = useState<HistoryEntry[]>([]);
	const sorter = useMemo(() => new PreferenceSorter(names.map((n) => String(n.id))), [names]);
	const [elo] = useState(() => new EloRating());
	const [_refreshKey, setRefreshKey] = useState(0);

	// Initialization & Restoration Effect
	const initializedRef = useRef(false);
	const lastNamesKeyRef = useRef("");

	useEffect(() => {
		const isNewNames = lastNamesKeyRef.current !== namesKey;

		if (isNewNames) {
			initializedRef.current = false;
			lastNamesKeyRef.current = namesKey;
		}

		if (initializedRef.current) {
			return;
		}

		if (!Array.isArray(names) || names.length < 2) {
			return;
		}

		// Check if we have valid persistent state for this tournament
		const hasValidPersistence = persistentState.namesKey === namesKey;

		if (hasValidPersistence) {
			// 1. Restore Sorter History
			if (sorter.currentIndex === 0 && persistentState.matchHistory.length > 0) {
				persistentState.matchHistory.forEach((record) => {
					if (record.winner && record.loser) {
						sorter.addPreference(record.winner, record.loser, 1);
					}
				});
			}

			// 2. Restore Ratings
			if (persistentState.ratings && Object.keys(persistentState.ratings).length > 0) {
				setRatings(persistentState.ratings);
			} else {
				// Fallback if ratings missing in persistence but history exists (shouldn't happen with new logic, but for safety)
				const initial: Record<string, number> = {};
				names.forEach((name) => {
					initial[name.id] = name.rating || 1500;
				});
				setRatings(initial);
			}
		} else {
			// New tournament or mismatch
			const estimatedMatches = (names.length * (names.length - 1)) / 2;

			// Reset persistent state for new tournament
			updatePersistentState({
				matchHistory: [],
				currentRound: 1,
				currentMatch: 1,
				totalMatches: estimatedMatches,
				namesKey,
				ratings: {},
			});

			// Initialize ratings from names
			const initial: Record<string, number> = {};
			names.forEach((name) => {
				initial[name.id] = name.rating || 1500;
			});
			setRatings(initial);
		}

		initializedRef.current = true;
		setRefreshKey((k) => k + 1);
	}, [namesKey, persistentState, sorter, names, updatePersistentState]);

	const ratingsRef = useRef(ratings);
	useEffect(() => {
		ratingsRef.current = ratings;
	}, [ratings]);

	// _refreshKey forces re-computation when sorter internal state changes (sorter is mutable)
	const currentMatch = useMemo(() => {
		void _refreshKey; // Force re-run when sorter mutates (addPreference/undo)
		const nextMatch = sorter.getNextMatch();
		if (!nextMatch) {
			return null;
		}

		return {
			left: names.find((n) => String(n.id) === nextMatch.left) || {
				id: nextMatch.left,
				name: nextMatch.left,
			},
			right: names.find((n) => String(n.id) === nextMatch.right) || {
				id: nextMatch.right,
				name: nextMatch.right,
			},
		} as Match;
	}, [sorter, names, _refreshKey]);

	const isComplete = currentMatch === null;
	const totalPairs = (names.length * (names.length - 1)) / 2;
	const completedMatches = persistentState.matchHistory.length;
	// Calculated matchNumber based on completed + 1 (if not complete)
	const matchNumber = isComplete ? completedMatches : completedMatches + 1;

	const roundMatchIndex = Math.max(1, matchNumber);
	const round = Math.floor((roundMatchIndex - 1) / Math.max(1, names.length)) + 1;

	// Progress and ETA
	const progress = useMemo(() => {
		if (!totalPairs) {
			return 0;
		}
		return Math.round((Math.min(completedMatches, totalPairs) / totalPairs) * 100);
	}, [completedMatches, totalPairs]);

	const etaMinutes = useMemo(() => {
		if (!totalPairs || completedMatches >= totalPairs) {
			return 0;
		}
		const remaining = totalPairs - completedMatches;
		// Assume 5 seconds per match as baseline
		return Math.ceil((remaining * 5) / 60);
	}, [completedMatches, totalPairs]);

	const handleVote = useCallback(
		(winnerId: string, loserId: string) => {
			if (!currentMatch) {
				return;
			}

			const ratingsSnapshot = ratingsRef.current;

			// Update ratings using ELO
			const winnerRating = ratingsSnapshot[winnerId] || 1500;
			const loserRating = ratingsSnapshot[loserId] || 1500;

			// Determine winner side for ELO calculation
			const leftId = String(
				typeof currentMatch.left === "object" ? currentMatch.left.id : currentMatch.left,
			);
			const outcome = winnerId === leftId ? "left" : "right";

			const result = elo.calculateNewRatings(winnerRating, loserRating, outcome);

			const newRatings = {
				...ratingsSnapshot,
				[winnerId]: result.newRatingA,
				[loserId]: result.newRatingB,
			};

			setRatings(newRatings);

			// Save to history (Local state for Undo)
			const matchRecord: MatchRecord = {
				match: currentMatch,
				winner: winnerId,
				loser: loserId,
				voteType: "normal",
				matchNumber,
				roundNumber: round,
				timestamp: Date.now(),
			};

			setHistory((prev) => [
				...prev,
				{
					match: currentMatch,
					ratings: { ...ratingsSnapshot },
					round,
					matchNumber,
				},
			]);

			// Update persistent state
			updatePersistentState({
				matchHistory: [...(persistentState.matchHistory || []), matchRecord],
				currentMatch: matchNumber + 1,
				ratings: newRatings, // Persist new ratings
			});

			// Record preference in sorter
			sorter.addPreference(winnerId, loserId, 1);

			// Trigger re-render to get next match
			setRefreshKey((k) => k + 1);
		},
		[
			currentMatch,
			round,
			matchNumber,
			sorter,
			elo,
			updatePersistentState,
			persistentState.matchHistory,
		],
	);

	const handleUndo = useCallback(() => {
		if (history.length === 0) {
			return;
		}

		const lastEntry = history[history.length - 1];
		if (!lastEntry) {
			return;
		}

		// Restore ratings from snapshot
		setRatings(lastEntry.ratings);

		// Remove last history entry
		setHistory((prev) => prev.slice(0, -1));

		// Revert sorter
		sorter.undoLastPreference();

		setRefreshKey((k) => k + 1);

		// Update persistent state
		const newHistory = persistentState.matchHistory.slice(0, -1);
		updatePersistentState({
			matchHistory: newHistory,
			currentMatch: Math.max(1, persistentState.currentMatch - 1),
			ratings: lastEntry.ratings, // Revert persisted ratings too
		});
	}, [history, sorter, persistentState, updatePersistentState]);

	const handleQuit = useCallback(() => {
		// Clear tournament state and navigate back
		updatePersistentState({
			matchHistory: [],
			currentRound: 1,
			currentMatch: 1,
			totalMatches: 0,
			ratings: {},
		});
		// Navigate back to name selection
		window.history.back();
	}, [updatePersistentState]);

	return {
		currentMatch,
		ratings,
		round,
		matchNumber,
		totalMatches: totalPairs,
		isComplete,
		handleVote,
		handleUndo,
		canUndo: history.length > 0,
		handleQuit,
		progress,
		etaMinutes,
	};
        matchHistory: MatchRecord[];
        currentRound: number;
        currentMatch: number;
        totalMatches: number;
        userName: string;
        lastUpdated: number;
        namesKey: string;
}

function createDefaultPersistentState(userName: string): PersistentTournamentState {
        return {
                matchHistory: [],
                currentRound: 1,
                currentMatch: 1,
                totalMatches: 0,
                userName: userName || "anonymous",
                lastUpdated: Date.now(),
                namesKey: "",
        };
}

export function useTournamentState(names: NameItem[], userName?: string): UseTournamentStateResult {
        const toast = useToast();
        const audioManager = useAudioManager();
        const [isVoting, setIsVoting] = useState(false);

        // --- Persistence setup ---
        const tournamentId = useMemo(() => {
                const sortedNames = names
                        .map((n) => n.name || n)
                        .sort()
                        .join("-");
                const prefix = userName || "anonymous";
                return `tournament-${prefix}-${sortedNames}`;
        }, [names, userName]);

        const defaultPersistentState = useMemo(
                () => createDefaultPersistentState(userName || "anonymous"),
                [userName],
        );

        const [persistentStateRaw, setPersistentState] = useLocalStorage<PersistentTournamentState>(
                tournamentId,
                defaultPersistentState,
                { debounceWait: 1000 },
        );

        const persistentState = useMemo(() => {
                if (
                        !persistentStateRaw ||
                        typeof persistentStateRaw !== "object" ||
                        Array.isArray(persistentStateRaw)
                ) {
                        return createDefaultPersistentState(userName || "anonymous");
                }
                return {
                        ...createDefaultPersistentState(userName || "anonymous"),
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
                        setPersistentState((prev) => {
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

        // --- State initialization ---
        const [ratings, setRatings] = useState<Record<string, number>>(() => {
                const initial: Record<string, number> = {};
                names.forEach((name) => {
                        initial[name.id] = name.rating || 1500;
                });
                return initial;
        });

        const ratingsRef = useRef(ratings);
        useEffect(() => {
                ratingsRef.current = ratings;
        }, [ratings]);

        // Memoize names key to prevent unnecessary re-initializations
        const namesKey = useMemo(
                () =>
                        names
                                .map((n) => n?.id || n?.name || "")
                                .filter(Boolean)
                                .sort()
                                .join(","),
                [names],
        );

        const [history, setHistory] = useState<HistoryEntry[]>([]);
        const sorter = useMemo(() => new PreferenceSorter(names.map((n) => String(n.id))), [names]);
        const [elo] = useState(() => new EloRating());
        const [_refreshKey, setRefreshKey] = useState(0);

        // Initialize tournament when names change
        useEffect(() => {
                if (!Array.isArray(names) || names.length < 2) {
                        return;
                }

                if (persistentState.namesKey === namesKey) {
                        return;
                }

                const estimatedMatches = (names.length * (names.length - 1)) / 2;

                updatePersistentState({
                        matchHistory: [],
                        currentRound: 1,
                        currentMatch: 1,
                        totalMatches: estimatedMatches,
                        namesKey,
                });

                // Force re-render to reset sorter state
                setRefreshKey((k) => k + 1);
        }, [namesKey, persistentState.namesKey, updatePersistentState, names]);

        // _refreshKey forces re-computation when sorter internal state changes (sorter is mutable)
        const currentMatch = useMemo(() => {
                void _refreshKey; // Force re-run when sorter mutates (addPreference/undo)
                const nextMatch = sorter.getNextMatch();
                if (!nextMatch) {
                        return null;
                }

                return {
                        left: names.find((n) => String(n.id) === nextMatch.left) || {
                                id: nextMatch.left,
                                name: nextMatch.left,
                        },
                        right: names.find((n) => String(n.id) === nextMatch.right) || {
                                id: nextMatch.right,
                                name: nextMatch.right,
                        },
                } as Match;
        }, [sorter, names, _refreshKey]);

        const isComplete = currentMatch === null;
        const totalPairs = (names.length * (names.length - 1)) / 2;
        const completedMatches = persistentState.matchHistory.length;
        const matchNumber =
                totalPairs > 0 ? Math.min(totalPairs, completedMatches + (isComplete ? 0 : 1)) : 0;
        const roundMatchIndex = isComplete ? Math.max(1, completedMatches) : Math.max(1, matchNumber);
        const round = Math.floor((roundMatchIndex - 1) / Math.max(1, names.length)) + 1;

        // Progress and ETA
        const progress = useMemo(() => {
                if (!totalPairs) {
                        return 0;
                }
                return Math.round((Math.min(completedMatches, totalPairs) / totalPairs) * 100);
        }, [completedMatches, totalPairs]);

        const etaMinutes = useMemo(() => {
                if (!totalPairs || completedMatches >= totalPairs) {
                        return 0;
                }
                const remaining = totalPairs - completedMatches;
                // Assume 3 seconds per match as baseline
                return Math.ceil((remaining * 3) / 60);
        }, [completedMatches, totalPairs]);

        const handleVote = useCallback(
                (winnerId: string, loserId: string) => {
                        if (!currentMatch) {
                                return;
                        }

                        const ratingsSnapshot = ratingsRef.current;

                        // Save to history
                        const matchRecord: MatchRecord = {
                                match: currentMatch,
                                winner: winnerId,
                                loser: loserId,
                                voteType: "normal",
                                matchNumber,
                                roundNumber: round,
                                timestamp: Date.now(),
                        };

                        setHistory((prev) => [
                                ...prev,
                                {
                                        match: currentMatch,
                                        ratings: { ...ratingsSnapshot },
                                        round,
                                        matchNumber,
                                },
                        ]);

                        updatePersistentState({
                                matchHistory: [...(persistentState.matchHistory || []), matchRecord],
                                currentMatch: matchNumber + 1,
                        });

                        // Update ratings using ELO
                        const winnerRating = ratingsSnapshot[winnerId] || 1500;
                        const loserRating = ratingsSnapshot[loserId] || 1500;

                        // Determine winner side for ELO calculation
                        const leftId = String(
                                typeof currentMatch.left === "object" ? currentMatch.left.id : currentMatch.left,
                        );
                        const outcome = winnerId === leftId ? "left" : "right";

                        const result = elo.calculateNewRatings(winnerRating, loserRating, outcome);

                        setRatings((prev) => ({
                                ...prev,
                                [winnerId]: result.newRatingA,
                                [loserId]: result.newRatingB,
                        }));

                        // Record preference in sorter
                        sorter.addPreference(winnerId, loserId, 1);

                        // Trigger re-render to get next match
                        setRefreshKey((k) => k + 1);
                },
                [
                        currentMatch,
                        round,
                        matchNumber,
                        sorter,
                        elo,
                        updatePersistentState,
                        persistentState.matchHistory,
                ],
        );

        const handleVoteWithAnimation = useCallback(
                (winnerId: string, loserId: string) => {
                        if (isVoting) return;

                        setIsVoting(true);
                        audioManager.playVoteSound();

                        setTimeout(() => {
                                handleVote(winnerId, loserId);
                                setIsVoting(false);
                        }, VOTE_COOLDOWN);
                },
                [handleVote, isVoting, audioManager],
        );

        const handleUndo = useCallback(() => {
                if (history.length === 0) {
                        toast.showWarning("No more moves to undo");
                        return;
                }

                const lastEntry = history[history.length - 1];
                if (!lastEntry) {
                        return;
                }

                audioManager.playUndoSound();
                setRatings(lastEntry.ratings);
                setHistory((prev) => prev.slice(0, -1));
                sorter.undoLastPreference();
                setRefreshKey((k) => k + 1);

                // Update persistent state
                const newHistory = persistentState.matchHistory.slice(0, -1);
                updatePersistentState({
                        matchHistory: newHistory,
                        currentMatch: Math.max(1, persistentState.currentMatch - 1),
                });
        }, [history, sorter, persistentState, updatePersistentState, toast, audioManager]);

        const handleQuit = useCallback(() => {
                // Clear tournament state and navigate back
                updatePersistentState({
                        matchHistory: [],
                        currentRound: 1,
                        currentMatch: 1,
                        totalMatches: 0,
                });
                // Navigate back to name selection
                window.history.back();
        }, [updatePersistentState]);

        return {
                currentMatch,
                ratings,
                round,
                matchNumber,
                totalMatches: totalPairs,
                isComplete,
                handleVote,
                handleUndo,
                canUndo: history.length > 0,
                handleQuit,
                progress,
                etaMinutes,
                isVoting,
                handleVoteWithAnimation,
        };
}
