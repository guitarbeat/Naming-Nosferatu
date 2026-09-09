export interface EloConfig {
	kFactor?: number;
	defaultRating?: number;
	minRating?: number;
	maxRating?: number;
	ratingDivisor?: number;
	newPlayerGameThreshold?: number;
	newPlayerKMultiplier?: number;
}

export function getExpectedEloScore(
	ra: number,
	rb: number,
	options?: { ratingDivisor?: number },
): number {
	const divisor = options?.ratingDivisor ?? 400;
	return 1 / (1 + 10 ** ((rb - ra) / divisor));
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
	outcome: "left" | "right" | "tie";
	leftStats?: { wins?: number; losses?: number };
	rightStats?: { wins?: number; losses?: number };
	config?: EloConfig;
}): {
	newRatingA: number;
	newRatingB: number;
	winsA: number;
	lossesA: number;
	winsB: number;
	lossesB: number;
} {
	const divisor = config?.ratingDivisor ?? 400;
	const minR = config?.minRating ?? 100;
	const maxR = config?.maxRating ?? 3000;
	const k = config?.kFactor ?? 32;

	const expectedA = 1 / (1 + 10 ** ((rightRating - leftRating) / divisor));
	const expectedB = 1 - expectedA;

	const actualA = outcome === "left" ? 1 : outcome === "right" ? 0 : 0.5;
	const actualB = 1 - actualA;

	const winsA = (leftStats?.wins ?? 0) + (outcome === "left" ? 1 : 0);
	const lossesA = (leftStats?.losses ?? 0) + (outcome === "right" ? 1 : 0);
	const winsB = (rightStats?.wins ?? 0) + (outcome === "right" ? 1 : 0);
	const lossesB = (rightStats?.losses ?? 0) + (outcome === "left" ? 1 : 0);

	const gamesA = winsA + lossesA;
	const gamesB = winsB + lossesB;

	const threshold = config?.newPlayerGameThreshold ?? 10;
	const multiplier = config?.newPlayerKMultiplier ?? 1.5;

	const kA = gamesA < threshold ? k * multiplier : k;
	const kB = gamesB < threshold ? k * multiplier : k;

	const newRatingA = Math.round(
		Math.min(maxR, Math.max(minR, leftRating + kA * (actualA - expectedA))),
	);
	const newRatingB = Math.round(
		Math.min(maxR, Math.max(minR, rightRating + kB * (actualB - expectedB))),
	);

	return {
		newRatingA,
		newRatingB,
		winsA,
		lossesA,
		winsB,
		lossesB,
	};
}

export function applyEloMatchUpdate({
	ratings,
	leftParticipantIds,
	rightParticipantIds,
	winnerSide,
	config,
}: {
	ratings: Record<string, number>;
	leftParticipantIds: (string | number)[];
	rightParticipantIds: (string | number)[];
	winnerSide: "left" | "right" | "tie";
	config?: EloConfig;
}): { ratings: Record<string, number> } {
	const updatedRatings = { ...ratings };
	const defaultRating = config?.defaultRating ?? 1200;

	const sumLeft = leftParticipantIds.reduce<number>(
		(acc, id) => acc + (Number(ratings[String(id)]) || defaultRating),
		0,
	);
	const avgLeftRating = sumLeft / (leftParticipantIds.length || 1);

	const sumRight = rightParticipantIds.reduce<number>(
		(acc, id) => acc + (Number(ratings[String(id)]) || defaultRating),
		0,
	);
	const avgRightRating = sumRight / (rightParticipantIds.length || 1);

	const { newRatingA, newRatingB } = calculatePairEloUpdate({
		leftRating: avgLeftRating,
		rightRating: avgRightRating,
		outcome: winnerSide,
		config,
	});

	const deltaA = newRatingA - avgLeftRating;
	const deltaB = newRatingB - avgRightRating;

	for (const id of leftParticipantIds) {
		const curr = Number(ratings[String(id)]) || defaultRating;
		updatedRatings[String(id)] = Math.round(curr + deltaA);
	}
	for (const id of rightParticipantIds) {
		const curr = Number(ratings[String(id)]) || defaultRating;
		updatedRatings[String(id)] = Math.round(curr + deltaB);
	}

	return { ratings: updatedRatings };
}
