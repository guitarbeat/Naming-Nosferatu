import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EloRating, PreferenceSorter } from "@/services/tournament";
import type { Match, NameItem } from "@/types/appTypes";

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
}

interface HistoryEntry {
	match: Match;
	ratings: Record<string, number>;
	round: number;
	matchNumber: number;
}

export function useTournamentState(names: NameItem[]): UseTournamentStateResult {
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
	const matchNumber = sorter.currentIndex + 1;
	const round = Math.floor(sorter.currentIndex / Math.max(1, names.length)) + 1;

	const handleVote = useCallback(
		(winnerId: string, loserId: string) => {
			if (!currentMatch) {
				return;
			}

			const ratingsSnapshot = ratingsRef.current;

			// Save to history
			setHistory((prev) => [
				...prev,
				{
					match: currentMatch,
					ratings: { ...ratingsSnapshot },
					round,
					matchNumber,
				},
			]);

			// Update ratings using ELO
			const winnerRating = ratingsSnapshot[winnerId] || 1500;
			const loserRating = ratingsSnapshot[loserId] || 1500;

			const result = elo.calculateNewRatings(winnerRating, loserRating, "left");

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
		if (history.length === 0) {
			return;
		}

		const lastEntry = history[history.length - 1];
		if (!lastEntry) {
			return;
		}
		setRatings(lastEntry.ratings);
		setHistory((prev) => prev.slice(0, -1));
		sorter.undoLastPreference();
		setRefreshKey((k) => k + 1);
	}, [history, sorter]);

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
	};
}
