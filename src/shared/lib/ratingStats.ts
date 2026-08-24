import { max, mean, medianSorted, min, standardDeviation } from "simple-statistics";

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
		// ⚡ Bolt Optimization: Replace `median()` with `medianSorted()` since the array is already sorted, saving an O(N log N) clone+sort.
		median: medianSorted(sorted),
		stdDev: standardDeviation(ratings),
		min: min(sorted),
		max: max(sorted),
		count: ratings.length,
	};
}

/**
 * Returns the percentile rank using quantileRankSorted for more precise statistics.
 */
export function getPercentileRank(rating: number, allRatings: number[]): number {
	if (allRatings.length === 0) {
		return 50;
	}
	let belowCount = 0;
	// ⚡ Bolt Optimization: Replace `[...arr].sort().filter()` chain with O(N) pass.
	// We only need to count elements below the target value, avoiding any array creations or sorts.
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
