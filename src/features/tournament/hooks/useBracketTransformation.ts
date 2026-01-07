import { useMemo } from "react";
import { calculateBracketRound } from "../../../shared/utils/core";
import type { BracketMatch, NameItem } from "../../../types/components";

interface MatchHistoryItem {
	match?: {
		left?: {
			name?: string;
			won?: boolean;
		};
		right?: {
			name?: string;
			won?: boolean;
		};
	};
	result?: number;
	matchNumber?: number;
}

export function useBracketTransformation(
	matchHistory: MatchHistoryItem[],
	visibleNames: NameItem[],
): BracketMatch[] {
	return useMemo((): BracketMatch[] => {
		if (!visibleNames || visibleNames.length === 0) {
			return [];
		}

		return matchHistory.map((vote, index: number) => {
			// Prefer explicit win flags if available
			const leftWon = vote?.match?.left?.won === true;
			const rightWon = vote?.match?.right?.won === true;
			let winner;
			if (leftWon && rightWon) {
				winner = 0; // both advance
			} else if (leftWon && !rightWon) {
				winner = -1; // left wins
			} else if (!leftWon && rightWon) {
				winner = 1; // right wins
			} else {
				// Fallback to numeric result thresholds
				if (typeof vote.result === "number") {
					if (vote.result < -0.1) {
						winner = -1;
					} else if (vote.result > 0.1) {
						winner = 1;
					} else if (Math.abs(vote.result) <= 0.1) {
						winner = 0; // tie
					} else {
						winner = 2; // skipped/other
					}
				} else {
					winner = 2;
				}
			}

			const matchNumber = vote?.matchNumber ?? index + 1;

			// * Calculate round using shared utility function
			const calculatedRound = calculateBracketRound(visibleNames.length, matchNumber);

			const bracketMatch: BracketMatch = {
				id: matchNumber,
				round: calculatedRound,
				name1: vote?.match?.left?.name || "Unknown",
				name2: vote?.match?.right?.name || "Unknown",
				winner,
			};
			return bracketMatch;
		});
	}, [matchHistory, visibleNames]);
}
