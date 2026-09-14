import { describe, expect, it } from "vitest";
import { applyEloMatchUpdate, calculatePairEloUpdate, getExpectedEloScore } from "./elo";

describe("elo module", () => {
	describe("getExpectedEloScore", () => {
		it("returns 0.5 when ratings are equal", () => {
			expect(getExpectedEloScore(1200, 1200)).toBeCloseTo(0.5, 5);
			expect(getExpectedEloScore(1500, 1500)).toBeCloseTo(0.5, 5);
		});

		it("returns a higher probability (> 0.5) when ra is greater than rb", () => {
			const expectedA = getExpectedEloScore(1600, 1200);
			expect(expectedA).toBeGreaterThan(0.5);
			expect(expectedA).toBeCloseTo(0.909, 3);
		});

		it("returns a lower probability (< 0.5) when ra is less than rb", () => {
			const expectedA = getExpectedEloScore(1200, 1600);
			expect(expectedA).toBeLessThan(0.5);
			expect(expectedA).toBeCloseTo(0.0909, 3);
		});

		it("ensures expected scores for A and B sum to 1", () => {
			const ra = 1500;
			const rb = 1300;
			const expectedA = getExpectedEloScore(ra, rb);
			const expectedB = getExpectedEloScore(rb, ra);
			expect(expectedA + expectedB).toBeCloseTo(1, 5);
		});

		it("supports custom ratingDivisor option", () => {
			// With default divisor (400), diff of 400 gives 1 / (1 + 10^1) = 1/11 ≈ 0.090909
			const defaultDivisorScore = getExpectedEloScore(1200, 1600);
			// With custom divisor (800), diff of 400 gives 1 / (1 + 10^0.5) = 1 / (1 + 3.16227) ≈ 0.24025
			const customDivisorScore = getExpectedEloScore(1200, 1600, {
				ratingDivisor: 800,
			});

			expect(defaultDivisorScore).toBeCloseTo(0.090909, 5);
			expect(customDivisorScore).toBeCloseTo(0.240253, 5);
		});

		it("handles extreme rating differences correctly", () => {
			// Very high rating advantage
			expect(getExpectedEloScore(3000, 100)).toBeCloseTo(1, 4);
			// Very low rating disadvantage
			expect(getExpectedEloScore(100, 3000)).toBeCloseTo(0, 4);
		});
	});

	describe("calculatePairEloUpdate", () => {
		it("updates ratings and win/loss stats correctly when left wins", () => {
			const result = calculatePairEloUpdate({
				leftRating: 1200,
				rightRating: 1200,
				outcome: "left",
				leftStats: { wins: 5, losses: 5 },
				rightStats: { wins: 2, losses: 8 },
			});

			expect(result.winsA).toBe(6);
			expect(result.lossesA).toBe(5);
			expect(result.winsB).toBe(2);
			expect(result.lossesB).toBe(9);
			expect(result.newRatingA).toBeGreaterThan(1200);
			expect(result.newRatingB).toBeLessThan(1200);
		});

		it("updates ratings correctly when right wins or tie", () => {
			const rightWin = calculatePairEloUpdate({
				leftRating: 1200,
				rightRating: 1200,
				outcome: "right",
			});
			expect(rightWin.winsA).toBe(0);
			expect(rightWin.lossesA).toBe(1);
			expect(rightWin.winsB).toBe(1);
			expect(rightWin.lossesB).toBe(0);
			expect(rightWin.newRatingA).toBeLessThan(1200);
			expect(rightWin.newRatingB).toBeGreaterThan(1200);

			const tie = calculatePairEloUpdate({
				leftRating: 1200,
				rightRating: 1200,
				outcome: "tie",
			});
			expect(tie.newRatingA).toBe(1200);
			expect(tie.newRatingB).toBe(1200);
		});

		it("applies new player K-multiplier threshold", () => {
			// Left player has < 10 games (threshold default: 10, multiplier: 1.5) -> K = 32 * 1.5 = 48
			// Right player has > 10 games -> K = 32
			const resultNewPlayer = calculatePairEloUpdate({
				leftRating: 1200,
				rightRating: 1200,
				outcome: "left",
				leftStats: { wins: 0, losses: 0 },
				rightStats: { wins: 10, losses: 5 },
			});

			const ratingGainLeft = resultNewPlayer.newRatingA - 1200;
			const ratingLossRight = 1200 - resultNewPlayer.newRatingB;

			expect(ratingGainLeft).toBeGreaterThan(ratingLossRight);
		});

		it("clamps ratings between minRating and maxRating", () => {
			const minClamped = calculatePairEloUpdate({
				leftRating: 100,
				rightRating: 1200,
				outcome: "right",
				config: { minRating: 100 },
			});
			expect(minClamped.newRatingA).toBe(100);

			const maxClamped = calculatePairEloUpdate({
				leftRating: 3000,
				rightRating: 1200,
				outcome: "left",
				config: { maxRating: 3000 },
			});
			expect(maxClamped.newRatingA).toBe(3000);
		});
	});

	describe("applyEloMatchUpdate", () => {
		it("calculates team average ratings and updates individual ratings accordingly", () => {
			const initialRatings = {
				player1: 1400,
				player2: 1200,
				player3: 1300,
			};

			const result = applyEloMatchUpdate({
				ratings: initialRatings,
				leftParticipantIds: ["player1", "player2"],
				rightParticipantIds: ["player3"],
				winnerSide: "left",
			});

			// Left average: 1300, Right average: 1300
			// Left team won, so player1 and player2 gain rating, player3 loses rating
			expect(result.ratings.player1).toBeGreaterThan(1400);
			expect(result.ratings.player2).toBeGreaterThan(1200);
			expect(result.ratings.player3).toBeLessThan(1300);
		});

		it("uses default rating when participant is not present in ratings object", () => {
			const result = applyEloMatchUpdate({
				ratings: {},
				leftParticipantIds: ["newPlayer1"],
				rightParticipantIds: ["newPlayer2"],
				winnerSide: "right",
				config: { defaultRating: 1000 },
			});

			expect(result.ratings.newPlayer1).toBeLessThan(1000);
			expect(result.ratings.newPlayer2).toBeGreaterThan(1000);
		});
	});
});
