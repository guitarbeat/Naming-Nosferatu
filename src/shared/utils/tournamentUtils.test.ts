import { describe, expect, it } from "vitest";
import { computeRating } from "./tournamentUtils";

describe("computeRating", () => {
	it("should clamp the result between 1000 and 2000", () => {
		expect(computeRating(2500, 2500, 10, 10)).toBe(2000);
		expect(computeRating(500, 500, 10, 10)).toBe(1000);
	});

	it("should blend ratings based on matches played", () => {
		const existingRating = 1500;
		const newPositionRating = 1600;
		const matchesPlayed = 5;
		const maxMatches = 10;

		// safeMaxMatches = 10
		// clampedMatchesPlayed = 5
		// blendFactor = Math.min(0.8, (5/10) * 0.9) = 0.45
		// newRating = 0.45 * 1600 + 0.55 * 1500 = 720 + 825 = 1545

		expect(computeRating(existingRating, newPositionRating, matchesPlayed, maxMatches)).toBe(1545);
	});

	it("should clamp matchesPlayed to maxMatches", () => {
		const existingRating = 1500;
		const newPositionRating = 1600;
		const matchesPlayed = 20; // Exceeds maxMatches
		const maxMatches = 10;

		// safeMaxMatches = 10
		// clampedMatchesPlayed = 10
		// blendFactor = Math.min(0.8, (10/10) * 0.9) = 0.9 -> Math.min(0.8, 0.9) = 0.8

		// newRating = 0.8 * 1600 + 0.2 * 1500 = 1280 + 300 = 1580

		expect(computeRating(existingRating, newPositionRating, matchesPlayed, maxMatches)).toBe(1580);
	});

	it("should handle zero maxMatches gracefully", () => {
		const existingRating = 1500;
		const newPositionRating = 1600;
		const matchesPlayed = 5;
		const maxMatches = 0;

		// safeMaxMatches = 1
		// clampedMatchesPlayed = Math.min(5, 1) = 1
		// blendFactor = Math.min(0.8, (1/1) * 0.9) = 0.8

		// newRating = 0.8 * 1600 + 0.2 * 1500 = 1580

		expect(computeRating(existingRating, newPositionRating, matchesPlayed, maxMatches)).toBe(1580);
	});
});
