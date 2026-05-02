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

		describe("edge cases", () => {
			it("returns 50 when all inputs are invalid (null or NaN)", () => {
				expect(calculatePercentile(10, [NaN, null] as Array<number | null>)).toBe(50);
			});

			it("ignores invalid values and uses only valid numbers for calculation", () => {
				// Valid values: [5, 10]. Value 10. Below: 5 (1 item). Total 2. 1/2 = 50%
				expect(calculatePercentile(10, [5, NaN, 10, null] as Array<number | null>)).toBe(50);
			});

			it("returns 0 if the value is NaN", () => {
				expect(calculatePercentile(NaN, [5, 10])).toBe(0);
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

		it("linearly increases up to the threshold", () => {
			expect(getConfidenceScore(7.5, 15)).toBe(0.5);
		});

		it("caps at 1.0", () => {
			expect(getConfidenceScore(20, 15)).toBe(1);
		});
	});

	describe("getZScore", () => {
		it("calculates Z-score correctly", () => {
			const stats = { mean: 1100, stdDev: 100 } as any;
			expect(getZScore(1200, stats)).toBe(1);
			expect(getZScore(1000, stats)).toBe(-1);
		});

		it("returns 0 when stdDev is 0", () => {
			const stats = { mean: 1100, stdDev: 0 } as any;
			expect(getZScore(1200, stats)).toBe(0);
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

		it("calculates correct zScore if stats are missing", () => {
			const enriched = enrichRating(1200, 10, [1000, 1100, 1200], null);
			expect(enriched.zScore).toBe(0);
		});
	});
});
