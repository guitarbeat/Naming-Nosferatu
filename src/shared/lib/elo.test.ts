import { describe, expect, it } from "vitest";
import { getExpectedEloScore } from "./elo";

describe("elo", () => {
	describe("getExpectedEloScore", () => {
		it("calculates correct expected score when ratings are equal", () => {
			expect(getExpectedEloScore(1500, 1500)).toBe(0.5);
			expect(getExpectedEloScore(2000, 2000)).toBe(0.5);
		});

		it("calculates expected score for different ratings correctly", () => {
			// A rating difference of 400 points should result in an expected score of ~0.909 for the higher rating
			const expectedWin = getExpectedEloScore(1900, 1500);
			expect(expectedWin).toBeCloseTo(0.909, 3);

			// And the expected score for the lower rating should be ~0.091
			const expectedLoss = getExpectedEloScore(1500, 1900);
			expect(expectedLoss).toBeCloseTo(0.091, 3);

			// Expected scores should sum to 1
			expect(expectedWin + expectedLoss).toBeCloseTo(1, 5);
		});

		it("calculates expected score for large rating difference correctly", () => {
			const expectedWin = getExpectedEloScore(2400, 800);
			expect(expectedWin).toBeCloseTo(0.9999, 4);

			const expectedLoss = getExpectedEloScore(800, 2400);
			expect(expectedLoss).toBeCloseTo(0.0001, 4);
		});

		it("respects custom configuration for ratingDivisor", () => {
			// With a divisor of 100, a difference of 100 points should give a similar probability
			// to a difference of 400 points with the default divisor of 400.
			const customConfig = { ratingDivisor: 100 };
			const expectedWinCustom = getExpectedEloScore(1600, 1500, customConfig);
			expect(expectedWinCustom).toBeCloseTo(0.909, 3);

			const expectedLossCustom = getExpectedEloScore(1500, 1600, customConfig);
			expect(expectedLossCustom).toBeCloseTo(0.091, 3);
		});

		it("handles zero rating difference correctly with custom configuration", () => {
			const customConfig = { ratingDivisor: 100 };
			expect(getExpectedEloScore(1200, 1200, customConfig)).toBe(0.5);
		});

		it("handles edge cases with floating point ratings", () => {
			const expectedWin = getExpectedEloScore(1500.5, 1500.5);
			expect(expectedWin).toBe(0.5);

			const diffWin = getExpectedEloScore(1500.75, 1500.25);
			expect(diffWin).toBeGreaterThan(0.5);
		});
	});
});
