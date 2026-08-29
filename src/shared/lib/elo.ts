import { max, mean, medianSorted, min, standardDeviation } from "simple-statistics";
import { ELO_RATING } from "./constants";

export interface RatingStats {
	mean: number;
	median: number;
	stdDev: number;
	min: number;
	max: number;
	count: number;
}

export interface EnrichedRating {
	rating: number;
	percentileRank: number;
	confidence: number;
	zScore: number;
}

export function computeRatingStats(ratings: number[]): RatingStats | null {
	if (ratings.length < 2) {
		return null;
	}
	const sorted = [...ratings].sort((a, b) => a - b);
	return {
		mean: mean(ratings),
		median: medianSorted(sorted),
		stdDev: standardDeviation(ratings),
		min: min(sorted),
		max: max(sorted),
		count: ratings.length,
	};
}

export function getPercentileRank(rating: number, allRatings: number[]): number {
	if (allRatings.length === 0) {
		return 50;
	}
	let belowCount = 0;
	for (let i = 0; i < allRatings.length; i++) {
		if (allRatings[i] < rating) {
			belowCount++;
		}
	}
	const len = allRatings.length;
	if (len === 1) {
		return 100;
	}
	return Math.round((belowCount / (len - 1)) * 100);
}

export function getConfidenceScore(gamesPlayed: number, threshold = 15): number {
	if (gamesPlayed <= 0) {
		return 0;
	}
	if (gamesPlayed >= threshold) {
		return 1;
	}
	return gamesPlayed / threshold;
}

export function getZScore(rating: number, stats: RatingStats): number {
	if (stats.stdDev === 0) {
		return 0;
	}
	return (rating - stats.mean) / stats.stdDev;
}

export function enrichRating(
	rating: number,
	gamesPlayed: number,
	allRatings: number[],
	stats: RatingStats | null,
): EnrichedRating {
	return {
		rating,
		percentileRank: getPercentileRank(rating, allRatings),
		confidence: getConfidenceScore(gamesPlayed),
		zScore: stats ? getZScore(rating, stats) : 0,
	};
}

export interface EloConfig {
	defaultRating?: number;
	kFactor?: number;
	minRating?: number;
	maxRating?: number;
	ratingDivisor?: number;
	newPlayerGameThreshold?: number;
	newPlayerKMultiplier?: number;
}

export interface EloStats {
	wins?: number;
	losses?: number;
}

export interface EloParticipantResult {
	rating: number;
	wins: number;
	losses: number;
	delta: number;
}

export interface EloPairResult {
	newRatingA: number;
	newRatingB: number;
	winsA: number;
	lossesA: number;
	winsB: number;
	lossesB: number;
	expectedScoreA: number;
	expectedScoreB: number;
}

export interface EloMatchResult {
	ratings: Record<string, number>;
	stats: Record<string, { wins: number; losses: number }>;
	participants: Record<string, EloParticipantResult>;
	leftAverageRating: number;
	rightAverageRating: number;
}

export type EloOutcome = "left" | "right" | "tie";

const DEFAULT_ELO_CONFIG: Required<EloConfig> = {
	defaultRating: ELO_RATING.DEFAULT_RATING,
	kFactor: ELO_RATING.DEFAULT_K_FACTOR,
	minRating: ELO_RATING.MIN_RATING,
	maxRating: ELO_RATING.MAX_RATING,
	ratingDivisor: ELO_RATING.RATING_DIVISOR,
	newPlayerGameThreshold: ELO_RATING.NEW_PLAYER_GAME_THRESHOLD,
	newPlayerKMultiplier: ELO_RATING.NEW_PLAYER_K_MULTIPLIER,
};

function resolveConfig(config?: EloConfig): Required<EloConfig> {
	return {
		...DEFAULT_ELO_CONFIG,
		...config,
	};
}

function clampRating(rating: number, config: Required<EloConfig>): number {
	return Math.max(config.minRating, Math.min(config.maxRating, rating));
}

function normalizeRating(rating: number | undefined, config: Required<EloConfig>): number {
	return typeof rating === "number" && Number.isFinite(rating) ? rating : config.defaultRating;
}

function normalizeStats(stats?: EloStats): { wins: number; losses: number } {
	return {
		wins: typeof stats?.wins === "number" && Number.isFinite(stats.wins) ? stats.wins : 0,
		losses: typeof stats?.losses === "number" && Number.isFinite(stats.losses) ? stats.losses : 0,
	};
}

function getActualScores(outcome: EloOutcome): { left: number; right: number } {
	if (outcome === "left") {
		return { left: 1, right: 0 };
	}
	if (outcome === "right") {
		return { left: 0, right: 1 };
	}
	return { left: 0.5, right: 0.5 };
}

function _average(values: number[]): number {
	if (values.length === 0) {
		throw new Error("Cannot calculate Elo for an empty side");
	}

	return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function applyParticipantUpdates(
	participantIds: string[],
	delta: number,
	outcomeScore: number,
	ratings: Record<string, number>,
	stats: Record<string, EloStats> | undefined,
	resolvedConfig: Required<EloConfig>,
	nextRatings: Record<string, number>,
	nextStats: Record<string, EloStats>,
	participants: Record<string, EloParticipantResult>,
) {
	for (const participantId of participantIds) {
		const currentRating = normalizeRating(ratings[participantId], resolvedConfig);
		const currentStats = normalizeStats(stats?.[participantId]);

		const updatedRating = clampRating(Math.round(currentRating + delta), resolvedConfig);
		nextRatings[participantId] = updatedRating;

		nextStats[participantId] = {
			wins: currentStats.wins + (outcomeScore === 1 ? 1 : 0),
			losses: currentStats.losses + (outcomeScore === 0 ? 1 : 0),
		};

		participants[participantId] = {
			rating: updatedRating,
			wins: nextStats[participantId]?.wins ?? 0,
			losses: nextStats[participantId]?.losses ?? 0,
			delta: updatedRating - currentRating,
		};
	}
}
export function getExpectedEloScore(
	currentRating: number,
	opponentRating: number,
	config?: EloConfig,
): number {
	const resolved = resolveConfig(config);
	return 1 / (1 + 10 ** ((opponentRating - currentRating) / resolved.ratingDivisor));
}

export function updateEloRating({
	rating,
	expectedScore,
	actualScore,
	gamesPlayed = 0,
	config,
}: {
	rating: number;
	expectedScore: number;
	actualScore: number;
	gamesPlayed?: number;
	config?: EloConfig;
}): number {
	const resolved = resolveConfig(config);
	const multiplier =
		gamesPlayed < resolved.newPlayerGameThreshold ? resolved.newPlayerKMultiplier : 1;
	const updated = Math.round(
		rating + resolved.kFactor * multiplier * (actualScore - expectedScore),
	);
	return clampRating(updated, resolved);
}

export function calculatePairEloUpdate({
	leftRating,
	rightRating,
	outcome,
	leftStats,
	rightStats,
	config,
}: {
	leftRating: number;
	rightRating: number;
	outcome: EloOutcome;
	leftStats?: EloStats;
	rightStats?: EloStats;
	config?: EloConfig;
}): EloPairResult {
	const resolved = resolveConfig(config);
	const normalizedLeftStats = normalizeStats(leftStats);
	const normalizedRightStats = normalizeStats(rightStats);
	const expectedScoreA = getExpectedEloScore(leftRating, rightRating, resolved);
	const expectedScoreB = getExpectedEloScore(rightRating, leftRating, resolved);
	const actualScores = getActualScores(outcome);

	return {
		newRatingA: updateEloRating({
			rating: leftRating,
			expectedScore: expectedScoreA,
			actualScore: actualScores.left,
			gamesPlayed: normalizedLeftStats.wins + normalizedLeftStats.losses,
			config: resolved,
		}),
		newRatingB: updateEloRating({
			rating: rightRating,
			expectedScore: expectedScoreB,
			actualScore: actualScores.right,
			gamesPlayed: normalizedRightStats.wins + normalizedRightStats.losses,
			config: resolved,
		}),
		winsA: normalizedLeftStats.wins + (actualScores.left === 1 ? 1 : 0),
		lossesA: normalizedLeftStats.losses + (actualScores.left === 0 ? 1 : 0),
		winsB: normalizedRightStats.wins + (actualScores.right === 1 ? 1 : 0),
		lossesB: normalizedRightStats.losses + (actualScores.right === 0 ? 1 : 0),
		expectedScoreA,
		expectedScoreB,
	};
}

export function applyEloMatchUpdate({
	ratings,
	leftParticipantIds,
	rightParticipantIds,
	winnerSide,
	stats,
	config,
}: {
	ratings: Record<string, number>;
	leftParticipantIds: string[];
	rightParticipantIds: string[];
	winnerSide: EloOutcome;
	stats?: Record<string, EloStats>;
	config?: EloConfig;
}): EloMatchResult {
	const resolved = resolveConfig(config);
	let leftRatingSum = 0;
	let leftWinsSum = 0;
	let leftLossesSum = 0;
	for (let i = 0, len = leftParticipantIds.length; i < len; i++) {
		const id = leftParticipantIds[i];
		const r = ratings[id];
		leftRatingSum += typeof r === "number" && Number.isFinite(r) ? r : resolved.defaultRating;

		const pStats = stats?.[id];
		if (pStats) {
			const w = pStats.wins;
			const l = pStats.losses;
			leftWinsSum += typeof w === "number" && Number.isFinite(w) ? w : 0;
			leftLossesSum += typeof l === "number" && Number.isFinite(l) ? l : 0;
		}
	}
	if (leftParticipantIds.length === 0) {
		throw new Error("Cannot calculate Elo for an empty side");
	}
	const leftAverageRating = leftRatingSum / leftParticipantIds.length;
	const leftAggregateStats = { wins: leftWinsSum, losses: leftLossesSum };

	let rightRatingSum = 0;
	let rightWinsSum = 0;
	let rightLossesSum = 0;
	for (let i = 0, len = rightParticipantIds.length; i < len; i++) {
		const id = rightParticipantIds[i];
		const r = ratings[id];
		rightRatingSum += typeof r === "number" && Number.isFinite(r) ? r : resolved.defaultRating;

		const pStats = stats?.[id];
		if (pStats) {
			const w = pStats.wins;
			const l = pStats.losses;
			rightWinsSum += typeof w === "number" && Number.isFinite(w) ? w : 0;
			rightLossesSum += typeof l === "number" && Number.isFinite(l) ? l : 0;
		}
	}
	if (rightParticipantIds.length === 0) {
		throw new Error("Cannot calculate Elo for an empty side");
	}
	const rightAverageRating = rightRatingSum / rightParticipantIds.length;
	const rightAggregateStats = { wins: rightWinsSum, losses: rightLossesSum };
	const pairUpdate = calculatePairEloUpdate({
		leftRating: leftAverageRating,
		rightRating: rightAverageRating,
		outcome: winnerSide,
		leftStats: leftAggregateStats,
		rightStats: rightAggregateStats,
		config: resolved,
	});
	const leftDelta = pairUpdate.newRatingA - leftAverageRating;
	const rightDelta = pairUpdate.newRatingB - rightAverageRating;
	const nextRatings = { ...ratings };
	const nextStats = { ...(stats ?? {}) };
	const participants: Record<string, EloParticipantResult> = {};
	const actualScores = getActualScores(winnerSide);
	const leftOutcome = actualScores.left;
	const rightOutcome = actualScores.right;

	applyParticipantUpdates(
		leftParticipantIds,
		leftDelta,
		leftOutcome,
		ratings,
		stats,
		resolved,
		nextRatings,
		nextStats,
		participants,
	);
	applyParticipantUpdates(
		rightParticipantIds,
		rightDelta,
		rightOutcome,
		ratings,
		stats,
		resolved,
		nextRatings,
		nextStats,
		participants,
	);

	return {
		ratings: nextRatings,
		stats: nextStats as Record<string, { wins: number; losses: number }>,
		participants,
		leftAverageRating,
		rightAverageRating,
	};
}
