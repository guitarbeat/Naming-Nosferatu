import { useCallback, useMemo, useState } from "react";
import { EloRating, PreferenceSorter } from "@/services/coreServices";
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

	const [history, setHistory] = useState<HistoryEntry[]>([]);
	const [matchIndex, setMatchIndex] = useState(0);

	const sorter = useMemo(() => new PreferenceSorter(names.map((n) => n.id)), [names]);
	const matches = useMemo(() => sorter.getMatches(), [sorter]);

	const currentMatch = matches[matchIndex] || null;
	const isComplete = matchIndex >= matches.length;

	const handleVote = useCallback(
		(winnerId: string, loserId: string) => {
			if (!currentMatch) {
				return;
			}

			// Save to history
			setHistory((prev) => [
				...prev,
				{
					match: currentMatch,
					ratings: { ...ratings },
					round: Math.floor(matchIndex / names.length) + 1,
					matchNumber: matchIndex + 1,
				},
			]);

			// Update ratings
			const elo = new EloRating();
			const [newWinnerRating, newLoserRating] = elo.calculateNewRatings(
				ratings[winnerId] || 1500,
				ratings[loserId] || 1500,
				1,
			);

			setRatings((prev) => ({
				...prev,
				[winnerId]: newWinnerRating,
				[loserId]: newLoserRating,
			}));

			// Record preference
			sorter.recordPreference(winnerId, loserId);

			// Move to next match
			setMatchIndex((prev) => prev + 1);
		},
		[currentMatch, ratings, matchIndex, names.length, sorter],
	);

	const handleUndo = useCallback(() => {
		if (history.length === 0) {
			return;
		}

		const lastEntry = history[history.length - 1];
		setRatings(lastEntry.ratings);
		setMatchIndex((prev) => prev - 1);
		setHistory((prev) => prev.slice(0, -1));
	}, [history]);

	return {
		currentMatch,
		ratings,
		round: Math.floor(matchIndex / names.length) + 1,
		matchNumber: matchIndex + 1,
		totalMatches: matches.length,
		isComplete,
		handleVote,
		handleUndo,
		canUndo: history.length > 0,
	};
}
