import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocalStorage } from "@/hooks/useHooks";
import { EloRating, PreferenceSorter } from "@/services/tournament";
import type { Match, MatchRecord, NameItem } from "@/types/appTypes";

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
}

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

	const [history, setHistory] = useState<HistoryEntry[]>([]);
	const [sorter] = useState(() => new PreferenceSorter(names.map((n) => String(n.id))));
	const [elo] = useState(() => new EloRating());
	const [_refreshKey, setRefreshKey] = useState(0);

	// Initialize tournament when names change
	useEffect(() => {
		if (!Array.isArray(names) || names.length < 2) return;

		const namesKey = names
			.map((n) => n?.id || n?.name || "")
			.filter(Boolean)
			.sort()
			.join(",");
		if (persistentState.namesKey === namesKey) return;

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
	}, [names, persistentState.namesKey, updatePersistentState]);

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
	const matchNumber = Math.max(1, persistentState.currentMatch);
	const round = Math.floor((matchNumber - 1) / Math.max(1, names.length)) + 1;

	// Progress and ETA
	const progress = useMemo(() => {
		if (!totalPairs) return 0;
		return Math.round((matchNumber / totalPairs) * 100);
	}, [matchNumber, totalPairs]);

	const etaMinutes = useMemo(() => {
		if (!totalPairs || matchNumber >= totalPairs) return 0;
		const remaining = totalPairs - matchNumber;
		// Assume 5 seconds per match as baseline
		return Math.ceil((remaining * 5) / 60);
	}, [matchNumber, totalPairs]);

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
		[currentMatch, round, matchNumber, sorter, elo],
	);

	const handleUndo = useCallback(() => {
		if (history.length === 0) return;

		const lastEntry = history[history.length - 1];
		if (!lastEntry) return;

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
	}, [history, sorter, persistentState, updatePersistentState]);

	const handleQuit = useCallback(() => {
		// Clear tournament state and navigate back
		updatePersistentState({
			matchHistory: [],
			currentRound: 1,
			currentMatch: 1,
			totalMatches: 0,
			namesKey: "",
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
}
