import { describe, expect, it } from "vitest";
import { applyEloMatchUpdate, calculatePairEloUpdate, getExpectedEloScore } from "./elo";

describe("elo utility", () => {
	describe("getExpectedEloScore", () => {
		it("calculates expected score for equal ratings", () => {
			expect(getExpectedEloScore(1200, 1200)).toBeCloseTo(0.5);
		});

		it("calculates exact expected score for standard 400 rating difference", () => {
			// With 400 rating difference and default divisor 400:
			// Expected score = 1 / (1 + 10^(-1)) = 1 / 1.1 ≈ 0.9090909
			const scoreA = getExpectedEloScore(1600, 1200);
			const scoreB = getExpectedEloScore(1200, 1600);
			expect(scoreA).toBeCloseTo(1 / 1.1, 5);
			expect(scoreB).toBeCloseTo(1 / 11, 5);
		});

		it("maintains probability symmetry where scoreA + scoreB equals 1", () => {
			const ratings = [
				[1500, 1200],
				[2000, 800],
				[100, 2500],
				[1234.5, 567.8],
			];

			for (const [ra, rb] of ratings) {
				const scoreA = getExpectedEloScore(ra, rb);
				const scoreB = getExpectedEloScore(rb, ra);
				expect(scoreA + scoreB).toBeCloseTo(1.0, 10);
			}
		});

		it("defaults ratingDivisor to 400 when options is undefined or empty", () => {
			const scoreDefault = getExpectedEloScore(1600, 1200);
			const scoreEmptyObj = getExpectedEloScore(1600, 1200, {});
			const scoreExplicit400 = getExpectedEloScore(1600, 1200, { ratingDivisor: 400 });

			expect(scoreDefault).toBe(scoreExplicit400);
			expect(scoreEmptyObj).toBe(scoreExplicit400);
		});

		it("supports custom ratingDivisor option", () => {
			const standardScore = getExpectedEloScore(1400, 1200, { ratingDivisor: 400 });
			const customScoreSmallDivisor = getExpectedEloScore(1400, 1200, { ratingDivisor: 200 });
			const customScoreLargeDivisor = getExpectedEloScore(1400, 1200, { ratingDivisor: 800 });

			expect(customScoreSmallDivisor).toBeGreaterThan(standardScore);
			expect(customScoreLargeDivisor).toBeLessThan(standardScore);
		});

		it("handles extreme rating differences correctly", () => {
			const dominantScore = getExpectedEloScore(3000, 100);
			const underdogScore = getExpectedEloScore(100, 3000);

			expect(dominantScore).toBeCloseTo(1.0, 5);
			expect(underdogScore).toBeCloseTo(0.0, 5);
		});

		it("handles negative and non-integer rating inputs", () => {
			const score = getExpectedEloScore(-100.5, -500.5);
			expect(score).toBeGreaterThan(0.5);
			expect(score).toBeCloseTo(getExpectedEloScore(400, 0), 5);
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

		it("handles partial stats objects with only wins or losses defined", () => {
			const resultLeftWinsOnly = calculatePairEloUpdate({
				leftRating: 1200,
				rightRating: 1200,
				outcome: "left",
				leftStats: { wins: 4 }, // losses undefined
				rightStats: { losses: 2 }, // wins undefined
			});

			expect(resultLeftWinsOnly.winsA).toBe(5);
			expect(resultLeftWinsOnly.lossesA).toBe(0);
			expect(resultLeftWinsOnly.winsB).toBe(0);
			expect(resultLeftWinsOnly.lossesB).toBe(3);

			const resultRightWinsOnly = calculatePairEloUpdate({
				leftRating: 1200,
				rightRating: 1200,
				outcome: "right",
				leftStats: { losses: 3 }, // wins undefined
				rightStats: { wins: 7 }, // losses undefined
			});

			expect(resultRightWinsOnly.winsA).toBe(0);
			expect(resultRightWinsOnly.lossesA).toBe(4);
			expect(resultRightWinsOnly.winsB).toBe(8);
			expect(resultRightWinsOnly.lossesB).toBe(0);
		});

		it("does not increment wins or losses on tie outcome", () => {
			const result = calculatePairEloUpdate({
				leftRating: 1200,
				rightRating: 1200,
				outcome: "tie",
				leftStats: { wins: 5, losses: 5 },
				rightStats: { wins: 3, losses: 3 },
			});

			expect(result.winsA).toBe(5);
			expect(result.lossesA).toBe(5);
			expect(result.winsB).toBe(3);
			expect(result.lossesB).toBe(3);
		});

		it("tests exact boundary for newPlayerGameThreshold", () => {
			// Threshold is 10.
			// Prior games = 8 (+ 1 current = 9 games < 10) => K multiplier applied (32 * 1.5 = 48)
			const resultUnderThreshold = calculatePairEloUpdate({
				leftRating: 1200,
				rightRating: 1200,
				outcome: "left",
				leftStats: { wins: 5, losses: 3 }, // 8 prior games + 1 = 9 total games
				rightStats: { wins: 10, losses: 0 }, // 10 prior games + 0 = 10 total games
			});

			expect(resultUnderThreshold.newRatingA).toBe(1224); // K = 48 -> +24
			expect(resultUnderThreshold.newRatingB).toBe(1184); // K = 32 -> -16

			// Prior games = 9 (+ 1 current = 10 games >= 10) => Standard K factor (32)
			const resultAtThreshold = calculatePairEloUpdate({
				leftRating: 1200,
				rightRating: 1200,
				outcome: "left",
				leftStats: { wins: 5, losses: 4 }, // 9 prior games + 1 = 10 total games
				rightStats: { wins: 10, losses: 0 }, // 10 prior games + 0 = 10 total games
			});

			expect(resultAtThreshold.newRatingA).toBe(1216); // K = 32 -> +16
			expect(resultAtThreshold.newRatingB).toBe(1184); // K = 32 -> -16
		});

		it("uses custom ratingDivisor from config when calculating expected score", () => {
			const resultStandardDivisor = calculatePairEloUpdate({
				leftRating: 1600,
				rightRating: 1200,
				outcome: "left",
				leftStats: { wins: 10, losses: 10 },
				rightStats: { wins: 10, losses: 10 },
				config: { ratingDivisor: 400 },
			});

			const resultCustomDivisor = calculatePairEloUpdate({
				leftRating: 1600,
				rightRating: 1200,
				outcome: "left",
				leftStats: { wins: 10, losses: 10 },
				rightStats: { wins: 10, losses: 10 },
				config: { ratingDivisor: 200 },
			});

			// Smaller divisor exaggerates the rating gap, making expected win probability closer to 1.0,
			// which yields a smaller rating gain for the winner.
			const gainStandard = resultStandardDivisor.newRatingA - 1600;
			const gainCustom = resultCustomDivisor.newRatingA - 1600;
			expect(gainCustom).toBeLessThan(gainStandard);
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

	describe("applyEloMatchUpdate", () => {
		it("updates ratings for 1v1 match when left side wins", () => {
			const initialRatings = { "cat-1": 1200, "cat-2": 1200 };
			const result = applyEloMatchUpdate({
				ratings: initialRatings,
				leftParticipantIds: ["cat-1"],
				rightParticipantIds: ["cat-2"],
				winnerSide: "left",
			});

			expect(result.ratings["cat-1"]).toBeGreaterThan(1200);
			expect(result.ratings["cat-2"]).toBeLessThan(1200);
			expect(result.ratings["cat-1"]).toBe(1224);
			expect(result.ratings["cat-2"]).toBe(1176);
		});

		it("updates ratings for 1v1 match when right side wins", () => {
			const initialRatings = { "cat-1": 1200, "cat-2": 1200 };
			const result = applyEloMatchUpdate({
				ratings: initialRatings,
				leftParticipantIds: ["cat-1"],
				rightParticipantIds: ["cat-2"],
				winnerSide: "right",
			});

			expect(result.ratings["cat-1"]).toBe(1176);
			expect(result.ratings["cat-2"]).toBe(1224);
		});

		it("updates ratings correctly on tie match", () => {
			const initialRatings = { "cat-1": 1200, "cat-2": 1200 };
			const result = applyEloMatchUpdate({
				ratings: initialRatings,
				leftParticipantIds: ["cat-1"],
				rightParticipantIds: ["cat-2"],
				winnerSide: "tie",
			});

			expect(result.ratings["cat-1"]).toBe(1200);
			expect(result.ratings["cat-2"]).toBe(1200);
		});

		it("handles team/group matches with average team ratings", () => {
			const initialRatings = {
				p1: 1000,
				p2: 1200,
				p3: 1400,
				p4: 1600,
			};
			const result = applyEloMatchUpdate({
				ratings: initialRatings,
				leftParticipantIds: ["p1", "p2"],
				rightParticipantIds: ["p3", "p4"],
				winnerSide: "left",
			});

			const deltaP1 = result.ratings.p1 - 1000;
			const deltaP2 = result.ratings.p2 - 1200;
			const deltaP3 = result.ratings.p3 - 1400;
			const deltaP4 = result.ratings.p4 - 1600;

			expect(deltaP1).toBe(deltaP2);
			expect(deltaP3).toBe(deltaP4);
			expect(deltaP1).toBeGreaterThan(0);
			expect(deltaP3).toBeLessThan(0);
		});

		it("uses default rating for unrated or missing participant IDs", () => {
			const initialRatings = { "cat-1": 1400 };
			const result = applyEloMatchUpdate({
				ratings: initialRatings,
				leftParticipantIds: ["cat-1"],
				rightParticipantIds: ["cat-2"],
				winnerSide: "left",
			});

			expect(result.ratings["cat-2"]).toBeDefined();
			expect(typeof result.ratings["cat-2"]).toBe("number");
			expect(result.ratings["cat-2"]).toBeLessThan(1200);
		});

		it("supports numeric participant IDs alongside string IDs", () => {
			const initialRatings = { "101": 1300, "102": 1300 };
			const result = applyEloMatchUpdate({
				ratings: initialRatings,
				leftParticipantIds: [101],
				rightParticipantIds: [102],
				winnerSide: "right",
			});

			expect(result.ratings["101"]).toBeLessThan(1300);
			expect(result.ratings["102"]).toBeGreaterThan(1300);
		});

		it("respects custom EloConfig settings (kFactor, defaultRating, minRating, maxRating)", () => {
			const initialRatings = { p1: 100, p2: 1200 };
			const customConfig = {
				kFactor: 64,
				defaultRating: 1500,
				minRating: 100,
				maxRating: 2000,
				newPlayerGameThreshold: 0,
			};

			const result = applyEloMatchUpdate({
				ratings: initialRatings,
				leftParticipantIds: ["p1"],
				rightParticipantIds: ["p2"],
				winnerSide: "right",
				config: customConfig,
			});

			expect(result.ratings.p1).toBe(100);
		});

		it("handles empty participant ID lists gracefully without throwing errors", () => {
			const initialRatings = { p1: 1200 };
			const result = applyEloMatchUpdate({
				ratings: initialRatings,
				leftParticipantIds: [],
				rightParticipantIds: ["p1"],
				winnerSide: "left",
			});

			expect(result.ratings).toBeDefined();
			expect(result.ratings.p1).toBeDefined();
		});
	});
});
