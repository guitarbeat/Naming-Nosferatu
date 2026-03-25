export interface PureEloConfig {
	defaultRating?: number;
	kFactor?: number;
	minRating?: number;
	maxRating?: number;
	ratingDivisor?: number;
	newPlayerGameThreshold?: number;
	newPlayerKMultiplier?: number;
}

export interface PureEloStats {
	wins?: number;
	losses?: number;
}

export interface PureEloParticipantResult {
	rating: number;
	wins: number;
	losses: number;
	delta: number;
}

export interface PureEloPairResult {
	newRatingA: number;
	newRatingB: number;
	winsA: number;
	lossesA: number;
	winsB: number;
	lossesB: number;
	expectedScoreA: number;
	expectedScoreB: number;
}

export interface PureEloMatchResult {
	ratings: Record<string, number>;
	stats: Record<string, { wins: number; losses: number }>;
	participants: Record<string, PureEloParticipantResult>;
	leftAverageRating: number;
	rightAverageRating: number;
}

export type PureEloOutcome = "left" | "right" | "tie";

const DEFAULT_ELO_CONFIG: Required<PureEloConfig> = {
	defaultRating: 1500,
	kFactor: 40,
	minRating: 800,
	maxRating: 2400,
	ratingDivisor: 400,
	newPlayerGameThreshold: 15,
	newPlayerKMultiplier: 2,
};

function resolveConfig(config?: PureEloConfig): Required<PureEloConfig> {
	return {
		...DEFAULT_ELO_CONFIG,
		...config,
	};
}

function clampRating(rating: number, config: Required<PureEloConfig>): number {
	return Math.max(config.minRating, Math.min(config.maxRating, rating));
}

function normalizeRating(rating: number | undefined, config: Required<PureEloConfig>): number {
	return typeof rating === "number" && Number.isFinite(rating) ? rating : config.defaultRating;
}

function normalizeStats(stats?: PureEloStats): { wins: number; losses: number } {
	return {
		wins: typeof stats?.wins === "number" && Number.isFinite(stats.wins) ? stats.wins : 0,
		losses: typeof stats?.losses === "number" && Number.isFinite(stats.losses) ? stats.losses : 0,
	};
}

function getActualScores(outcome: PureEloOutcome): { left: number; right: number } {
	if (outcome === "left") {
		return { left: 1, right: 0 };
	}
	if (outcome === "right") {
		return { left: 0, right: 1 };
	}
	return { left: 0.5, right: 0.5 };
}

function average(values: number[]): number {
	if (values.length === 0) {
		throw new Error("Cannot calculate Elo for an empty side");
	}

	return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function getExpectedEloScore(
	currentRating: number,
	opponentRating: number,
	config?: PureEloConfig,
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
	config?: PureEloConfig;
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
	outcome: PureEloOutcome;
	leftStats?: PureEloStats;
	rightStats?: PureEloStats;
	config?: PureEloConfig;
}): PureEloPairResult {
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
	winnerSide: PureEloOutcome;
	stats?: Record<string, PureEloStats>;
	config?: PureEloConfig;
}): PureEloMatchResult {
	const resolved = resolveConfig(config);
	const leftRatings = leftParticipantIds.map((id) => normalizeRating(ratings[id], resolved));
	const rightRatings = rightParticipantIds.map((id) => normalizeRating(ratings[id], resolved));
	const leftAverageRating = average(leftRatings);
	const rightAverageRating = average(rightRatings);
	const leftAggregateStats = leftParticipantIds.reduce(
		(acc, participantId) => {
			const participantStats = normalizeStats(stats?.[participantId]);
			return {
				wins: acc.wins + participantStats.wins,
				losses: acc.losses + participantStats.losses,
			};
		},
		{ wins: 0, losses: 0 },
	);
	const rightAggregateStats = rightParticipantIds.reduce(
		(acc, participantId) => {
			const participantStats = normalizeStats(stats?.[participantId]);
			return {
				wins: acc.wins + participantStats.wins,
				losses: acc.losses + participantStats.losses,
			};
		},
		{ wins: 0, losses: 0 },
	);
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
	const participants: Record<string, PureEloParticipantResult> = {};
	const actualScores = getActualScores(winnerSide);
	const leftOutcome = actualScores.left;
	const rightOutcome = actualScores.right;

	for (const participantId of leftParticipantIds) {
		const currentRating = normalizeRating(ratings[participantId], resolved);
		const currentStats = normalizeStats(stats?.[participantId]);
		const updatedRating = clampRating(Math.round(currentRating + leftDelta), resolved);

		nextRatings[participantId] = updatedRating;
		nextStats[participantId] = {
			wins: currentStats.wins + (leftOutcome === 1 ? 1 : 0),
			losses: currentStats.losses + (leftOutcome === 0 ? 1 : 0),
		};
		participants[participantId] = {
			rating: updatedRating,
			wins: nextStats[participantId].wins,
			losses: nextStats[participantId].losses,
			delta: updatedRating - currentRating,
		};
	}

	for (const participantId of rightParticipantIds) {
		const currentRating = normalizeRating(ratings[participantId], resolved);
		const currentStats = normalizeStats(stats?.[participantId]);
		const updatedRating = clampRating(Math.round(currentRating + rightDelta), resolved);

		nextRatings[participantId] = updatedRating;
		nextStats[participantId] = {
			wins: currentStats.wins + (rightOutcome === 1 ? 1 : 0),
			losses: currentStats.losses + (rightOutcome === 0 ? 1 : 0),
		};
		participants[participantId] = {
			rating: updatedRating,
			wins: nextStats[participantId].wins,
			losses: nextStats[participantId].losses,
			delta: updatedRating - currentRating,
		};
	}

	return {
		ratings: nextRatings,
		stats: nextStats as Record<string, { wins: number; losses: number }>,
		participants,
		leftAverageRating,
		rightAverageRating,
	};
}
