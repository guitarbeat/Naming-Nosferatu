import { describe, expect, it } from "vitest";
import { applyEloMatchUpdate, calculatePairEloUpdate, getExpectedEloScore } from "./elo";

describe("elo utility", () => {
	describe("getExpectedEloScore", () => {
		it("calculates expected score for equal ratings", () => {
			expect(getExpectedEloScore(1200, 1200)).toBe(0.5);
		});

		it("calculates expected score when rating A is higher", () => {
			const score = getExpectedEloScore(1400, 1200);
			expect(score).toBeGreaterThan(0.5);
			expect(score).toBeCloseTo(0.7597, 3);
		});

		it("respects custom ratingDivisor config option", () => {
			const standard = getExpectedEloScore(1400, 1200, { ratingDivisor: 400 });
			const custom = getExpectedEloScore(1400, 1200, { ratingDivisor: 200 });
			expect(custom).toBeGreaterThan(standard);
		});
	});

	describe("calculatePairEloUpdate", () => {
		it("calculates rating updates when left wins", () => {
			const result = calculatePairEloUpdate({
				leftRating: 1200,
				rightRating: 1200,
				outcome: "left",
			});
			expect(result.newRatingA).toBe(1224);
			expect(result.newRatingB).toBe(1176);
			expect(result.winsA).toBe(1);
			expect(result.lossesA).toBe(0);
			expect(result.winsB).toBe(0);
			expect(result.lossesB).toBe(1);
		});

		it("calculates rating updates when right wins", () => {
			const result = calculatePairEloUpdate({
				leftRating: 1200,
				rightRating: 1200,
				outcome: "right",
			});
			expect(result.newRatingA).toBe(1176);
			expect(result.newRatingB).toBe(1224);
			expect(result.winsA).toBe(0);
			expect(result.lossesA).toBe(1);
			expect(result.winsB).toBe(1);
			expect(result.lossesB).toBe(0);
		});

		it("calculates rating updates on tie", () => {
			const result = calculatePairEloUpdate({
				leftRating: 1200,
				rightRating: 1200,
				outcome: "tie",
			});
			expect(result.newRatingA).toBe(1200);
			expect(result.newRatingB).toBe(1200);
			expect(result.winsA).toBe(0);
			expect(result.lossesA).toBe(0);
			expect(result.winsB).toBe(0);
			expect(result.lossesB).toBe(0);
		});

		it("uses existing stats and applies established player kFactor when games threshold is met", () => {
			const result = calculatePairEloUpdate({
				leftRating: 1500,
				rightRating: 1500,
				outcome: "left",
				leftStats: { wins: 5, losses: 5 },
				rightStats: { wins: 5, losses: 5 },
			});
			expect(result.newRatingA).toBe(1516);
			expect(result.newRatingB).toBe(1484);
			expect(result.winsA).toBe(6);
			expect(result.lossesA).toBe(5);
			expect(result.winsB).toBe(5);
			expect(result.lossesB).toBe(6);
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
