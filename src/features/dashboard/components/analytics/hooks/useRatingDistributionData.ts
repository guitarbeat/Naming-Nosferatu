import { useMemo } from "react";
import { computeRatingStats } from "@/shared/lib/ratingStats";

const BUCKET_SIZE = 25;

export function bucketLabel(bucketStart: number) {
	return `${bucketStart}–${bucketStart + BUCKET_SIZE}`;
}

export function useRatingDistributionData(
	leaderboard: Array<{
		name: string;
		avg_rating: number;
		wins: number;
		total_ratings: number;
	}>,
) {
	const ratings = useMemo(() => {
		const result: number[] = [];
		for (let i = 0; i < leaderboard.length; i++) {
			const e = leaderboard[i];
			if ((e.total_ratings ?? 0) > 0) {
				result.push(Math.round(e.avg_rating));
			}
		}
		return result;
	}, [leaderboard]);

	const stats = useMemo(() => computeRatingStats(ratings), [ratings]);

	const data = useMemo(() => {
		if (ratings.length === 0) {
			return [];
		}

		let minRating = Number.POSITIVE_INFINITY;
		let maxRating = Number.NEGATIVE_INFINITY;
		for (const r of ratings) {
			if (r < minRating) {
				minRating = r;
			}
			if (r > maxRating) {
				maxRating = r;
			}
		}

		const minBucket = Math.floor(minRating / BUCKET_SIZE) * BUCKET_SIZE;
		const maxBucket = Math.ceil(maxRating / BUCKET_SIZE) * BUCKET_SIZE;

		const buckets: Record<number, number> = {};
		for (let b = minBucket; b <= maxBucket; b += BUCKET_SIZE) {
			buckets[b] = 0;
		}
		for (const r of ratings) {
			const bucket = Math.floor(r / BUCKET_SIZE) * BUCKET_SIZE;
			buckets[bucket] = (buckets[bucket] ?? 0) + 1;
		}

		const chartData = [];
		for (const keyStr in buckets) {
			const keyNum = Number(keyStr);
			chartData.push({
				range: bucketLabel(keyNum),
				bucketStart: keyNum,
				count: buckets[keyNum],
			});
		}
		return chartData.sort((a, b) => a.bucketStart - b.bucketStart);
	}, [ratings]);

	const meanBucket = useMemo(() => {
		if (!stats) {
			return null;
		}
		return Math.floor(stats.mean / BUCKET_SIZE) * BUCKET_SIZE;
	}, [stats]);

	const stdDevBuckets = useMemo(() => {
		if (!stats || stats.stdDev <= 0) {
			return null;
		}
		const lo = Math.floor((stats.mean - stats.stdDev) / BUCKET_SIZE) * BUCKET_SIZE;
		const hi = Math.floor((stats.mean + stats.stdDev) / BUCKET_SIZE) * BUCKET_SIZE;
		return { lo: bucketLabel(lo), hi: bucketLabel(hi) };
	}, [stats]);

	let maxCount = 0;
	for (let i = 0; i < data.length; i++) {
		if (data[i].count > maxCount) {
			maxCount = data[i].count;
		}
	}

	return { ratings, stats, data, meanBucket, stdDevBuckets, maxCount };
}
