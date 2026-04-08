import {
	max,
	mean,
	median,
	min,
	quantileRankSorted,
	standardDeviation,
} from "simple-statistics";

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
	if (ratings.length < 2) return null;
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

export function getPercentileRank(rating: number, allRatings: number[]): number {
	if (allRatings.length === 0) return 50;
	const sorted = [...allRatings].sort((a, b) => a - b);
	return Math.round(quantileRankSorted(sorted, rating) * 100);
}

export function getConfidenceScore(gamesPlayed: number, threshold = 15): number {
	if (gamesPlayed <= 0) return 0;
	if (gamesPlayed >= threshold) return 1;
	return gamesPlayed / threshold;
}

export function getZScore(rating: number, stats: RatingStats): number {
	if (stats.stdDev === 0) return 0;
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
