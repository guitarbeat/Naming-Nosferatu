import { useCallback, useMemo } from "react";
import type { MatchHistoryRecord, MatchNode } from "@/shared/types";
import { getHeatLevel, type HeatLevel, STREAK_THRESHOLDS } from "../utils/heat";
import { extractMatchData, getMatchSideId } from "../utils/matchHelpers";

interface UseTournamentViewDataProps {
	currentMatch: MatchNode | null;
	matchHistory: MatchHistoryRecord[];
	ratings: Record<string, number>;
	currentMatchNumber: number;
	totalMatches: number;
	roundNumber: number;
	totalRounds: number;
}

function getStageHeadline(round: number, totalRounds: number): string {
	if (round >= totalRounds) {
		return "Championship pick";
	}
	if (totalRounds - round === 1) {
		return "Final four pressure";
	}
	if (round <= 1) {
		return "Opening chaos";
	}
	return "Bracket pressure";
}

function getPressureCopy({
	round,
	totalRounds,
	currentMatchNumber,
	totalMatches,
	ratingGap,
}: {
	round: number;
	totalRounds: number;
	currentMatchNumber: number;
	totalMatches: number;
	ratingGap: number;
}): string {
	if (round >= totalRounds) {
		return "Last decision. Winner takes the crown.";
	}
	if (ratingGap <= 24) {
		return "Too close to call. Go with the name that survives on vibe alone.";
	}
	if (currentMatchNumber >= totalMatches - 1) {
		return "The bracket is nearly locked. Every pick now reshapes the podium.";
	}
	if (round <= 1) {
		return "Set the tone early. One upset can warp the whole tournament path.";
	}
	return "Momentum matters now. Protect a streak or torch the favorite.";
}

export function useTournamentViewData({
	currentMatch,
	matchHistory,
	ratings,
	currentMatchNumber,
	totalMatches,
	roundNumber,
	totalRounds,
}: UseTournamentViewDataProps) {
	const calculateWinStreak = useCallback(
		(contestantId: string | number | null | undefined) => {
			if (!contestantId || matchHistory.length === 0) {
				return 0;
			}
			const targetId = String(contestantId);
			let streak = 0;
			for (let i = matchHistory.length - 1; i >= 0; i--) {
				const record = matchHistory[i];
				if (!record) {
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
		() =>
			currentMatch
				? calculateWinStreak(getMatchSideId(currentMatch, "left"))
				: 0,
		[currentMatch, calculateWinStreak],
	);
	const rightStreak = useMemo(
		() =>
			currentMatch
				? calculateWinStreak(getMatchSideId(currentMatch, "right"))
				: 0,
		[currentMatch, calculateWinStreak],
	);
	const leftHeatLevel = useMemo(() => getHeatLevel(leftStreak), [leftStreak]);
	const rightHeatLevel = useMemo(
		() => getHeatLevel(rightStreak),
		[rightStreak],
	);

	const matchData = useMemo(
		() => (currentMatch ? extractMatchData(currentMatch) : null),
		[currentMatch],
	);

	const dominantStreak =
		leftStreak >= rightStreak
			? leftStreak >= STREAK_THRESHOLDS.warm
				? {
						name: matchData?.leftName || "",
						streak: leftStreak,
						heatLevel: leftHeatLevel ?? ("warm" as HeatLevel),
					}
				: null
			: rightStreak >= STREAK_THRESHOLDS.warm
				? {
						name: matchData?.rightName || "",
						streak: rightStreak,
						heatLevel: rightHeatLevel ?? ("warm" as HeatLevel),
					}
				: null;

	const leftRating = matchData ? (ratings[matchData.leftId] ?? 1500) : 1500;
	const rightRating = matchData ? (ratings[matchData.rightId] ?? 1500) : 1500;
	const ratingGap = Math.abs(leftRating - rightRating);
	const leftIsFavored = leftRating > rightRating;
	const rightIsFavored = rightRating > leftRating;
	const matchesRemaining = Math.max(0, totalMatches - currentMatchNumber);
	const roundMatchesLeft = Math.max(
		0,
		Math.ceil((totalMatches - currentMatchNumber) / 2),
	);
	const stageHeadline = getStageHeadline(roundNumber, totalRounds);
	const pressureCopy = getPressureCopy({
		round: roundNumber,
		totalRounds,
		currentMatchNumber,
		totalMatches,
		ratingGap,
	});
	const matchupTone =
		ratingGap <= 24
			? "Dead heat"
			: leftIsFavored
				? `${matchData?.leftName} leads by ${Math.round(ratingGap)}`
				: `${matchData?.rightName} leads by ${Math.round(ratingGap)}`;

	return {
		matchData,
		leftStreak,
		rightStreak,
		leftHeatLevel,
		rightHeatLevel,
		dominantStreak,
		leftRating,
		rightRating,
		ratingGap,
		leftIsFavored,
		rightIsFavored,
		matchesRemaining,
		roundMatchesLeft,
		stageHeadline,
		pressureCopy,
		matchupTone,
	};
}
