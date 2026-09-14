import { describe, expect, it } from "vitest";
import { calculatePairEloUpdate, getExpectedEloScore } from "./elo";

describe("elo utility", () => {
	describe("getExpectedEloScore", () => {
		it("calculates expected score for equal ratings", () => {
			expect(getExpectedEloScore(1200, 1200)).toBeCloseTo(0.5);
		});

		it("calculates expected score for higher rated player A", () => {
			const scoreA = getExpectedEloScore(1600, 1200);
			const scoreB = getExpectedEloScore(1200, 1600);
			expect(scoreA).toBeGreaterThan(0.5);
			expect(scoreB).toBeLessThan(0.5);
			expect(scoreA + scoreB).toBeCloseTo(1.0);
		});

		it("supports custom ratingDivisor option", () => {
			const standardScore = getExpectedEloScore(1400, 1200, { ratingDivisor: 400 });
			const customScore = getExpectedEloScore(1400, 1200, { ratingDivisor: 200 });
			expect(customScore).toBeGreaterThan(standardScore);
		});
	});

	describe("calculatePairEloUpdate", () => {
		it("updates ratings and stats correctly when left side wins", () => {
			const result = calculatePairEloUpdate({
				leftRating: 1200,
				rightRating: 1200,
				outcome: "left",
				leftStats: { wins: 5, losses: 2 },
				rightStats: { wins: 3, losses: 4 },
			});

			expect(result.winsA).toBe(6);
			expect(result.lossesA).toBe(2);
			expect(result.winsB).toBe(3);
			expect(result.lossesB).toBe(5);

			// Equal initial ratings, expected 0.5 each. Outcome = 1 for A.
			// gamesA = 8, gamesB = 8 (both < default threshold 10, K = 32 * 1.5 = 48)
			// change = 48 * (1 - 0.5) = +24 for A, -24 for B
			expect(result.newRatingA).toBe(1224);
			expect(result.newRatingB).toBe(1176);
		});

		it("updates ratings and stats correctly when right side wins", () => {
			const result = calculatePairEloUpdate({
				leftRating: 1200,
				rightRating: 1200,
				outcome: "right",
				leftStats: { wins: 10, losses: 5 },
				rightStats: { wins: 12, losses: 2 },
			});

			expect(result.winsA).toBe(10);
			expect(result.lossesA).toBe(6);
			expect(result.winsB).toBe(13);
			expect(result.lossesB).toBe(2);

			// Both have > 10 games, K = 32
			// Expected 0.5. Outcome = 0 for A (loss), 1 for B (win)
			// change = 32 * (0 - 0.5) = -16 for A, +16 for B
			expect(result.newRatingA).toBe(1184);
			expect(result.newRatingB).toBe(1216);
		});

		it("updates ratings correctly on a tie outcome", () => {
			const result = calculatePairEloUpdate({
				leftRating: 1400,
				rightRating: 1000,
				outcome: "tie",
				leftStats: { wins: 10, losses: 0 },
				rightStats: { wins: 10, losses: 0 },
			});

			expect(result.winsA).toBe(10);
			expect(result.lossesA).toBe(0);
			expect(result.winsB).toBe(10);
			expect(result.lossesB).toBe(0);

			// Expected score for 1400 vs 1000 is high for A (~0.909)
			// On tie (actual = 0.5), higher rated player loses rating, lower gains rating
			expect(result.newRatingA).toBeLessThan(1400);
			expect(result.newRatingB).toBeGreaterThan(1000);
		});

		it("handles default undefined stats gracefully", () => {
			const result = calculatePairEloUpdate({
				leftRating: 1200,
				rightRating: 1200,
				outcome: "left",
			});

			expect(result.winsA).toBe(1);
			expect(result.lossesA).toBe(0);
			expect(result.winsB).toBe(0);
			expect(result.lossesB).toBe(1);
		});

		it("applies new player K-factor multiplier when games < newPlayerGameThreshold", () => {
			const resultNewPlayer = calculatePairEloUpdate({
				leftRating: 1200,
				rightRating: 1200,
				outcome: "left",
				leftStats: { wins: 2, losses: 1 }, // 3 games < 10
				rightStats: { wins: 10, losses: 5 }, // 15 games >= 10
			});

			// Left: K = 32 * 1.5 = 48, delta = 48 * 0.5 = 24 -> rating 1224
			// Right: K = 32, delta = 32 * (0 - 0.5) = -16 -> rating 1184
			expect(resultNewPlayer.newRatingA).toBe(1224);
			expect(resultNewPlayer.newRatingB).toBe(1184);
		});

		it("respects custom config settings", () => {
			const config = {
				kFactor: 20,
				minRating: 500,
				maxRating: 2500,
				ratingDivisor: 400,
				newPlayerGameThreshold: 5,
				newPlayerKMultiplier: 2.0,
			};

			const result = calculatePairEloUpdate({
				leftRating: 1200,
				rightRating: 1200,
				outcome: "left",
				leftStats: { wins: 2, losses: 0 }, // 2 games < threshold 5 => K = 20 * 2 = 40
				rightStats: { wins: 6, losses: 0 }, // 6 games >= threshold 5 => K = 20
				config,
			});

			// Left delta = 40 * 0.5 = 20 -> 1220
			// Right delta = 20 * -0.5 = -10 -> 1190
			expect(result.newRatingA).toBe(1220);
			expect(result.newRatingB).toBe(1190);
		});

		it("caps ratings within minRating and maxRating boundaries", () => {
			const maxCapped = calculatePairEloUpdate({
				leftRating: 2995,
				rightRating: 2995,
				outcome: "left",
				leftStats: { wins: 20, losses: 0 },
				rightStats: { wins: 20, losses: 0 },
				config: { maxRating: 3000, kFactor: 100 },
			});

			expect(maxCapped.newRatingA).toBe(3000);

			const minCapped = calculatePairEloUpdate({
				leftRating: 105,
				rightRating: 105,
				outcome: "right",
				leftStats: { wins: 20, losses: 0 },
				rightStats: { wins: 20, losses: 0 },
				config: { minRating: 100, kFactor: 100 },
			});

			expect(minCapped.newRatingA).toBe(100);
		});
	});
});
