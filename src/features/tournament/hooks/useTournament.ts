import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/app/providers/Providers";
import { EloRating, PreferenceSorter } from "@/services/tournament";
import { useLocalStorage } from "@/shared/hooks";
import type { Match, MatchRecord, NameItem } from "@/shared/types";
import { useAudioManager } from "./useHelpers";

/* =========================================================================
   TYPES
   ========================================================================= */

export interface UseTournamentResult {
	currentMatch: Match | null;
	ratings: Record<string, number>;
	round: number;
	matchNumber: number;
	totalMatches: number;
	isComplete: boolean;
	handleVote: (winnerId: string, loserId: string) => void;
	handleUndo: () => void;
	canUndo: boolean;
	handleQuit: () => void;
	progress: number;
	etaMinutes: number;

	// Voting UI
	isVoting: boolean;
	selectedSide: "left" | "right" | null;
	handleVoteWithAnimation: (winnerIdOrSide: string, loserId?: string) => void;
	handleUndoWithAnimation: () => void;

	// Audio
	audioManager: ReturnType<typeof useAudioManager>;
}

interface PersistentTournamentState {
	matchHistory: MatchRecord[];
	currentRound: number;
	currentMatch: number;
	totalMatches: number;
	userName: string;
	lastUpdated: number;
	namesKey: string;
}

interface HistoryEntry {
	match: Match;
	ratings: Record<string, number>;
	round: number;
	matchNumber: number;
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

const VOTE_COOLDOWN = 300;

/* =========================================================================
   HOOK IMPLEMENTATION
   ========================================================================= */

export function useTournament(
	names: NameItem[],
	userName?: string,
	options?: {
		onVote?: (winnerId: string, loserId: string) => void;
		onComplete?: (ratings: Record<string, number>) => void;
	},
): UseTournamentResult {
	// --- Services & Utils ---
	const audioManager = useAudioManager();
	const toast = useToast();

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

	// Ref for access inside callbacks without dep cycle
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

	// Create sorter
	const sorter = useMemo(() => new PreferenceSorter(names.map((n) => String(n.id))), [names]);
	const [elo] = useState(() => new EloRating());
	const [_refreshKey, setRefreshKey] = useState(0);

	// --- Restoration Logic (Bug Fix) ---
	useEffect(() => {
		if (!sorter || !persistentState.matchHistory.length) {
			return;
		}

		// If sorter has processed fewer matches than history, replay the difference.
		if (sorter.currentIndex < persistentState.matchHistory.length) {
			const startIndex = sorter.currentIndex;
			const matchesToReplay = persistentState.matchHistory.slice(sorter.currentIndex);

			matchesToReplay.forEach((record) => {
				sorter.addPreference(record.winner, record.loser, 1);
			});

			// Replay ELO if we are starting fresh (sorter.currentIndex was 0)
			if (startIndex === 0) {
				const initialRatings: Record<string, number> = {};
				names.forEach((n) => {
					initialRatings[n.id] = n.rating || 1500;
				});

				persistentState.matchHistory.forEach((record) => {
					const wR = initialRatings[record.winner] || 1500;
					const lR = initialRatings[record.loser] || 1500;
					const res = elo.calculateNewRatings(wR, lR, "left");

					initialRatings[record.winner] = res.newRatingA;
					initialRatings[record.loser] = res.newRatingB;
				});
				setRatings(initialRatings);
			}

			setRefreshKey((k) => k + 1);
		}
	}, [sorter, persistentState.matchHistory, elo, names]);

	// --- Initialization ---
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

	// --- Computed State ---
	const currentMatch = useMemo(() => {
		void _refreshKey; // Force re-run when sorter mutates
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
		return Math.ceil((remaining * 3) / 60);
	}, [completedMatches, totalPairs]);

	// --- Actions ---

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

			// External callback
			options?.onVote?.(winnerId, loserId);
		},
		[
			currentMatch,
			round,
			matchNumber,
			sorter,
			elo,
			updatePersistentState,
			persistentState.matchHistory,
			options,
		],
	);

	const handleUndo = useCallback(() => {
		if (persistentState.matchHistory.length === 0) {
			return;
		}

		// Pop from persistent history
		const newHistory = persistentState.matchHistory.slice(0, -1);
		updatePersistentState({
			matchHistory: newHistory,
			currentMatch: Math.max(1, persistentState.currentMatch - 1),
		});

		// Undo sorter
		sorter.undoLastPreference();

		// Restore ratings
		if (history.length > 0) {
			const lastEntry = history[history.length - 1];
			setRatings(lastEntry.ratings);
			setHistory((prev) => prev.slice(0, -1));
		} else {
			// Replay from scratch if local history is empty (e.g. after refresh)
			const initialRatings: Record<string, number> = {};
			names.forEach((n) => {
				initialRatings[n.id] = n.rating || 1500;
			});

			const eloCalc = new EloRating();
			newHistory.forEach((record) => {
				const wR = initialRatings[record.winner] || 1500;
				const lR = initialRatings[record.loser] || 1500;
				const res = eloCalc.calculateNewRatings(wR, lR, "left");
				initialRatings[record.winner] = res.newRatingA;
				initialRatings[record.loser] = res.newRatingB;
			});
			setRatings(initialRatings);
		}

		setRefreshKey((k) => k + 1);
		audioManager.playUndoSound();
	}, [persistentState, updatePersistentState, sorter, history, names, audioManager]);

	const handleQuit = useCallback(() => {
		updatePersistentState({
			matchHistory: [],
			currentRound: 1,
			currentMatch: 1,
			totalMatches: 0,
		});
		window.history.back();
	}, [updatePersistentState]);

	// --- Voting Animation & UI ---

	const [isVoting, setIsVoting] = useState(false);
	const [selectedSide, setSelectedSide] = useState<"left" | "right" | null>(null);

	const handleVoteWithAnimation = useCallback(
		(winnerIdOrSide: string, loserId?: string) => {
			if (isVoting) {
				return;
			}

			// We need to resolve "left"/"right" here if only one arg is provided
			let winnerId: string;
			let loserIdFinal: string;
			let side: "left" | "right";

			if (loserId === undefined) {
				// Single parameter mode: "left" or "right"
				if (!currentMatch) {
					return;
				}

				side = winnerIdOrSide as "left" | "right";
				const leftId = String(
					typeof currentMatch.left === "object" ? currentMatch.left.id : currentMatch.left,
				);
				const rightId = String(
					typeof currentMatch.right === "object" ? currentMatch.right.id : currentMatch.right,
				);

				if (side === "left") {
					winnerId = leftId;
					loserIdFinal = rightId;
				} else {
					winnerId = rightId;
					loserIdFinal = leftId;
				}
			} else {
				winnerId = winnerIdOrSide;
				loserIdFinal = loserId as string;

				// Determine side for animation
				const isLeft =
					currentMatch &&
					(typeof currentMatch.left === "object" ? currentMatch.left.id : currentMatch.left) ===
						winnerId;
				side = isLeft ? "left" : "right";
			}

			setIsVoting(true);
			setSelectedSide(side);
			audioManager.playVoteSound();

			setTimeout(() => {
				handleVote(winnerId, loserIdFinal);
				setIsVoting(false);
				setSelectedSide(null);
			}, VOTE_COOLDOWN);
		},
		[isVoting, currentMatch, handleVote, audioManager],
	);

	const handleUndoWithAnimation = useCallback(() => {
		if (persistentState.matchHistory.length === 0) {
			toast.showWarning("No more moves to undo");
			return;
		}
		handleUndo();
	}, [persistentState.matchHistory.length, handleUndo, toast]);

	// Check completion
	useEffect(() => {
		if (isComplete && options?.onComplete) {
			options.onComplete(ratings);
		}
	}, [isComplete, options, ratings]);

	return {
		currentMatch,
		ratings,
		round,
		matchNumber,
		totalMatches: totalPairs,
		isComplete,
		handleVote,
		handleUndo,
		canUndo: persistentState.matchHistory.length > 0,
		handleQuit,
		progress,
		etaMinutes,
		isVoting,
		selectedSide,
		handleVoteWithAnimation,
		handleUndoWithAnimation,
		audioManager,
	};
}
