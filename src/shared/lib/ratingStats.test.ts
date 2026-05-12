import { describe, expect, it } from "vitest";
import {
	calculatePercentile,
	computeRatingStats,
	enrichRating,
	getConfidenceScore,
	getPercentileRank,
	getZScore,
} from "./ratingStats";

describe("ratingStats", () => {
	describe("computeRatingStats", () => {
		it("returns null for fewer than 2 ratings", () => {
			expect(computeRatingStats([1200])).toBeNull();
		});

		it("calculates basic stats correctly", () => {
			const ratings = [1000, 1100, 1200];
			const stats = computeRatingStats(ratings);
			expect(stats?.mean).toBe(1100);
			expect(stats?.median).toBe(1100);
			expect(stats?.count).toBe(3);
		});
	});

	describe("calculatePercentile", () => {
		describe("Higher is better (default)", () => {
			it("returns 50 when array is empty", () => {
				expect(calculatePercentile(10, [])).toBe(50);
			});

			it("calculates percentile correctly for simple case", () => {
				// 5, 10, 15. Value 10. Below: 5 (1 item). Total 3. 1/3 = 33%
				expect(calculatePercentile(10, [5, 10, 15])).toBe(33);
			});

			it("calculates 100th percentile if value is greater than all values in array", () => {
				// 5, 10. Value 15. Below: 5, 10. Total 2. 2/2 = 100%
				expect(calculatePercentile(15, [5, 10])).toBe(100);
			});
		});

		describe("Lower is better", () => {
			it("calculates percentile correctly for simple case", () => {
				// 5, 10, 15. Value 10. Above: 15 (1 item). Total 3. 1/3 = 33%
				expect(calculatePercentile(10, [5, 10, 15], false)).toBe(33);
			});
		});
	});

	describe("getPercentileRank", () => {
		it("returns 50 for empty array", () => {
			expect(getPercentileRank(1200, [])).toBe(50);
		});

		it("returns higher percentile for higher ratings", () => {
			const all = [1000, 1100, 1200, 1300, 1400];
			expect(getPercentileRank(1400, all)).toBe(100);
			expect(getPercentileRank(1000, all)).toBe(20);
		});
	});

	describe("getConfidenceScore", () => {
		it("returns 0 for no games", () => {
			expect(getConfidenceScore(0)).toBe(0);
		});

		it("returns 0 for negative games", () => {
			expect(getConfidenceScore(-5)).toBe(0);
		});

		it("linearly increases up to the threshold", () => {
			expect(getConfidenceScore(7.5, 15)).toBe(0.5);
		});

		it("caps at 1.0 when exceeding threshold", () => {
			expect(getConfidenceScore(20, 15)).toBe(1);
		});

		it("returns exactly 1.0 when hitting the threshold boundary", () => {
			expect(getConfidenceScore(15, 15)).toBe(1);
		});

		it("uses the default threshold of 15 when not provided", () => {
			expect(getConfidenceScore(7.5)).toBe(0.5);
			expect(getConfidenceScore(15)).toBe(1);
			expect(getConfidenceScore(30)).toBe(1);
		});

		it("handles custom thresholds correctly", () => {
			expect(getConfidenceScore(5, 10)).toBe(0.5);
			expect(getConfidenceScore(10, 10)).toBe(1);
			expect(getConfidenceScore(20, 10)).toBe(1);
		});

		it("handles edge case: Infinity games", () => {
			expect(getConfidenceScore(Infinity)).toBe(1);
		});

		it("handles edge case: NaN games", () => {
			expect(getConfidenceScore(NaN)).toBeNaN();
		});
	});

	describe("getZScore", () => {
		it("calculates Z-score correctly", () => {
			const stats = { mean: 1100, stdDev: 100 } as any;
			expect(getZScore(1200, stats)).toBe(1);
			expect(getZScore(1000, stats)).toBe(-1);
		});
	});

	describe("enrichRating", () => {
		it("combines multiple metrics into one object", () => {
			const all = [1000, 1100, 1200];
			const stats = computeRatingStats(all);
			const enriched = enrichRating(1200, 10, all, stats);
			expect(enriched.rating).toBe(1200);
			expect(enriched.percentileRank).toBeGreaterThan(0);
			expect(enriched.confidence).toBeGreaterThan(0);
		});
	});
});
