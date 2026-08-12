import { useCallback, useMemo } from "react";
import type { Match } from "@/shared/types";
import { getHeatLevel } from "../utils/heat";
import { getMatchSideId } from "../utils/matchHelpers";

export function useStreakCalculator(
	currentMatch: Match | null,
	matchHistory: Array<{ match: Match; winner: string | number }>,
) {
	const calculateWinStreak = useCallback(
		(contestantId: string | number | null | undefined) => {
			if (!contestantId || matchHistory.length === 0) {
				return 0;
			}
			const targetId = String(contestantId);
			let streak = 0;
			for (let i = matchHistory.length - 1; i >= 0; i--) {
				const record = matchHistory[i];
				if (!record || !record.match) {
					continue;
				}
				const leftId = getMatchSideId(record.match, "left");
				const rightId = getMatchSideId(record.match, "right");
				if (leftId !== targetId && rightId !== targetId) {
					continue;
				}
				if (record.winner === targetId) {
					streak++;
				} else {
					break;
				}
			}
			return streak;
		},
		[matchHistory],
	);

	const leftStreak = useMemo(
		() => (currentMatch ? calculateWinStreak(getMatchSideId(currentMatch, "left")) : 0),
		[currentMatch, calculateWinStreak],
	);

	const rightStreak = useMemo(
		() => (currentMatch ? calculateWinStreak(getMatchSideId(currentMatch, "right")) : 0),
		[currentMatch, calculateWinStreak],
	);

	const leftHeatLevel = useMemo(() => getHeatLevel(leftStreak), [leftStreak]);
	const rightHeatLevel = useMemo(() => getHeatLevel(rightStreak), [rightStreak]);

	return {
		leftStreak,
		rightStreak,
		leftHeatLevel,
		rightHeatLevel,
		calculateWinStreak,
	};
}
