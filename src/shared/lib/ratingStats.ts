import { max, mean, median, min, standardDeviation } from "simple-statistics";

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
		median: median(sorted),
		stdDev: standardDeviation(ratings),
		min: min(sorted),
		max: max(sorted),
		count: ratings.length,
	};
}

/**
 * Calculates the percentile rank of a value within a distribution.
 * Higher is better by default (percentile is percentage of values below).
 */
export function calculatePercentile(
	value: number,
	allValues: number[],
	higherIsBetter = true,
): number {
	if (Number.isNaN(value) || !allValues || allValues.length === 0) {
		return Number.isNaN(value) ? 0 : 50;
	}

	// Performance optimization: Calculate count without sorting O(N) vs O(N log N)
	let validCount = 0;
	let targetCount = 0;

	for (let i = 0; i < allValues.length; i++) {
		const v = allValues[i];
		if (v != null && !Number.isNaN(v)) {
			validCount += 1;
			if (higherIsBetter) {
				if (v < value) {
					targetCount += 1;
				}
			} else {
				if (v > value) {
					targetCount += 1;
				}
			}
		}
	}

	if (validCount === 0) {
		return 50;
	}

	return Math.round((targetCount / validCount) * 100);
}

/**
 * Returns the percentile rank using quantileRankSorted for more precise statistics.
 */
export function getPercentileRank(rating: number, allRatings: number[]): number {
	const len = allRatings.length;
	if (len === 0) {
		return 50;
	}
	if (len === 1) {
		return 100;
	}

	// Performance optimization: Calculate count without sorting O(N) vs O(N log N)
	let belowCount = 0;
	for (let i = 0; i < len; i++) {
		if (allRatings[i] !== undefined && (allRatings[i] as number) < rating) {
			belowCount += 1;
		}
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
