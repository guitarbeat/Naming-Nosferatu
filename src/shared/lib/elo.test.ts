import { describe, expect, it } from "vitest";
import { applyEloMatchUpdate } from "./elo";

describe("applyEloMatchUpdate", () => {
	it("should update elo ratings correctly for a 1v1 match (left wins)", () => {
		const result = applyEloMatchUpdate({
			ratings: { p1: 1500, p2: 1500 },
			leftParticipantIds: ["p1"],
			rightParticipantIds: ["p2"],
			winnerSide: "left",
		});

		expect(result.leftAverageRating).toBe(1500);
		expect(result.rightAverageRating).toBe(1500);
		expect(result.ratings.p1).toBeGreaterThan(1500);
		expect(result.ratings.p2).toBeLessThan(1500);
		expect(result.participants.p1.wins).toBe(1);
		expect(result.participants.p1.losses).toBe(0);
		expect(result.participants.p2.wins).toBe(0);
		expect(result.participants.p2.losses).toBe(1);
		expect(result.stats.p1.wins).toBe(1);
		expect(result.stats.p2.losses).toBe(1);
	});

	it("should update elo ratings correctly for a 1v1 match (right wins)", () => {
		const result = applyEloMatchUpdate({
			ratings: { p1: 1500, p2: 1500 },
			leftParticipantIds: ["p1"],
			rightParticipantIds: ["p2"],
			winnerSide: "right",
		});

		expect(result.ratings.p1).toBeLessThan(1500);
		expect(result.ratings.p2).toBeGreaterThan(1500);
		expect(result.participants.p1.losses).toBe(1);
		expect(result.participants.p2.wins).toBe(1);
	});

	it("should update elo ratings correctly for a tie", () => {
		const result = applyEloMatchUpdate({
			ratings: { p1: 1500, p2: 1600 }, // p2 is expected to win
			leftParticipantIds: ["p1"],
			rightParticipantIds: ["p2"],
			winnerSide: "tie",
		});

		// Lower rated player should gain rating, higher rated should lose on a tie
		expect(result.ratings.p1).toBeGreaterThan(1500);
		expect(result.ratings.p2).toBeLessThan(1600);
	});

	it("should handle missing participants gracefully using default ratings", () => {
		const result = applyEloMatchUpdate({
			ratings: { p1: 1500 }, // p2 rating missing
			leftParticipantIds: ["p1"],
			rightParticipantIds: ["p2"],
			winnerSide: "left",
		});

		expect(result.rightAverageRating).toBe(1500); // Default
		expect(result.ratings.p2).toBeLessThan(1500);
	});

	it("should properly accumulate stats if passed in", () => {
		const result = applyEloMatchUpdate({
			ratings: { p1: 1500, p2: 1500 },
			leftParticipantIds: ["p1"],
			rightParticipantIds: ["p2"],
			winnerSide: "left",
			stats: {
				p1: { wins: 5, losses: 2 },
				p2: { wins: 3, losses: 4 },
			},
		});

		expect(result.stats.p1.wins).toBe(6);
		expect(result.stats.p1.losses).toBe(2);
		expect(result.stats.p2.wins).toBe(3);
		expect(result.stats.p2.losses).toBe(5);
		expect(result.participants.p1.wins).toBe(6);
		expect(result.participants.p2.losses).toBe(5);
	});

	it("should distribute rating delta correctly in a team match", () => {
		const result = applyEloMatchUpdate({
			ratings: { p1: 1600, p2: 1400, p3: 1500, p4: 1500 },
			leftParticipantIds: ["p1", "p2"], // Avg 1500
			rightParticipantIds: ["p3", "p4"], // Avg 1500
			winnerSide: "left",
		});

		expect(result.leftAverageRating).toBe(1500);
		expect(result.rightAverageRating).toBe(1500);

		// Both members of left side should gain the same amount
		expect(result.participants.p1.delta).toBeGreaterThan(0);
		expect(result.participants.p2.delta).toBe(result.participants.p1.delta);

		// Both members of right side should lose the same amount
		expect(result.participants.p3.delta).toBeLessThan(0);
		expect(result.participants.p4.delta).toBe(result.participants.p3.delta);
	});

	it("should throw if left or right side is empty", () => {
		expect(() => {
			applyEloMatchUpdate({
				ratings: { p1: 1500 },
				leftParticipantIds: [],
				rightParticipantIds: ["p1"],
				winnerSide: "left",
			});
		}).toThrow("Cannot calculate Elo for an empty side");
	});
});
