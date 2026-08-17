import { useEffect, useRef } from "react";
import type { MatchHistoryRecord } from "@/shared/types";
import { normalizeParticipant } from "../utils/matchHelpers";
import type { AudioManager } from "./useAudioManager";

interface UseTournamentCompletionProps {
	isComplete: boolean;
	onComplete?: (
		results: Record<string, { rating: number; wins: number; losses: number }>,
	) => void;
	matchHistory: MatchHistoryRecord[];
	ratings: Record<string, number>;
	audioManager: AudioManager;
}

export function useTournamentCompletion({
	isComplete,
	onComplete,
	matchHistory,
	ratings,
	audioManager,
}: UseTournamentCompletionProps) {
	const completionHandledRef = useRef(false);

	useEffect(() => {
		if (!isComplete || !onComplete || completionHandledRef.current) {
			if (!isComplete) {
				completionHandledRef.current = false;
			}
			return;
		}
		completionHandledRef.current = true;
		audioManager.playLevelUpSound();
		setTimeout(() => audioManager.playWowSound(), 500);

		const winsByName: Record<string, number> = {};
		const lossesByName: Record<string, number> = {};

		for (const record of matchHistory) {
			if (!record?.match) {
				continue;
			}

			const left = normalizeParticipant(record.match.left);
			const right = normalizeParticipant(record.match.right);

			const isLeftWinner = left.memberIds.includes(String(record.winner));
			const winnerIds = isLeftWinner ? left.memberIds : right.memberIds;
			const loserIds = isLeftWinner ? right.memberIds : left.memberIds;

			for (const id of winnerIds) {
				if (id) {
					winsByName[id] = (winsByName[id] ?? 0) + 1;
				}
			}
			for (const id of loserIds) {
				if (id) {
					lossesByName[id] = (lossesByName[id] ?? 0) + 1;
				}
			}
		}

		const results: Record<
			string,
			{ rating: number; wins: number; losses: number }
		> = {};
		for (const [id, rating] of Object.entries(ratings)) {
			results[id] = {
				rating,
				wins: winsByName[id] ?? 0,
				losses: lossesByName[id] ?? 0,
			};
		}
		onComplete(results);
	}, [isComplete, ratings, onComplete, matchHistory, audioManager]);
}
