import { describe, expect, it } from "vitest";
import {
	computeRating,
	deduplicateImages,
	EloRating,
	getRandomCatImage,
	PreferenceSorter,
} from "./tournamentUtils";

describe("EloRating", () => {
	const elo = new EloRating();

	describe("getExpectedScore", () => {
		it("should return 0.5 for equal ratings", () => {
			expect(elo.getExpectedScore(1500, 1500)).toBeCloseTo(0.5);
		});

		it("should return > 0.5 when player A has higher rating", () => {
			expect(elo.getExpectedScore(1600, 1500)).toBeGreaterThan(0.5);
		});

		it("should return < 0.5 when player A has lower rating", () => {
			expect(elo.getExpectedScore(1400, 1500)).toBeLessThan(0.5);
		});
	});

	describe("calculateNewRatings", () => {
		it("should increase winner rating and decrease loser rating (Left Win)", () => {
			const result = elo.calculateNewRatings(1500, 1500, "left");
			expect(result.newRatingA).toBeGreaterThan(1500);
			expect(result.newRatingB).toBeLessThan(1500);
			expect(result.winsA).toBe(1);
			expect(result.lossesB).toBe(1);
		});

		it("should increase winner rating and decrease loser rating (Right Win)", () => {
			const result = elo.calculateNewRatings(1500, 1500, "right");
			expect(result.newRatingA).toBeLessThan(1500);
			expect(result.newRatingB).toBeGreaterThan(1500);
			expect(result.winsB).toBe(1);
			expect(result.lossesA).toBe(1);
		});

		it('should handle "both" vote correctly (both increase)', () => {
			const result = elo.calculateNewRatings(1500, 1500, "both");
			expect(result.newRatingA).toBeGreaterThan(1500);
			expect(result.newRatingB).toBeGreaterThan(1500);
			expect(result.winsA).toBe(1);
			expect(result.winsB).toBe(1);
		});
	});
});

describe("Utils", () => {
	describe("getRandomCatImage", () => {
		const images = ["img1.jpg", "img2.jpg", "img3.jpg"];

		it("should return deterministic image for same ID", () => {
			const result1 = getRandomCatImage("cat-1", images);
			const result2 = getRandomCatImage("cat-1", images);
			expect(result1).toBe(result2);
		});

		it("should return undefined for empty list", () => {
			expect(getRandomCatImage("cat-1", [])).toBeUndefined();
		});
	});

	describe("deduplicateImages", () => {
		it("should remove duplicates ignoring extension", () => {
			const input = ["cat.jpg", "cat.png", "dog.jpg"];
			const result = deduplicateImages(input);
			expect(result).toHaveLength(2);
			expect(result).toEqual(["cat.jpg", "dog.jpg"]);
		});
	});

	describe("PreferenceSorter", () => {
		const items = ["Apple", "Banana", "Cherry"];

		it("should initialize with all pairs generated", () => {
			const sorter = new PreferenceSorter(items);
			// for 3 items: (A,B), (A,C), (B,C) -> 3 pairs
			expect(sorter.pairs.length).toBe(3);
			expect(sorter.currentIndex).toBe(0);
		});

		it("should return next match correctly", () => {
			const sorter = new PreferenceSorter(items);
			const match = sorter.getNextMatch();
			expect(match).not.toBeNull();
			expect(match?.left).toBe("Apple");
			expect(match?.right).toBe("Banana");
		});

		it("should advance to next match after checking preference", () => {
			const sorter = new PreferenceSorter(items);
			// Mock that we judged the first one
			sorter.addPreference("Apple", "Banana", 1);

			// getNextMatch should skip the judged one
			const match = sorter.getNextMatch();
			expect(match?.left).toBe("Apple");
			expect(match?.right).toBe("Cherry");
		});

		it("should record history for undo", () => {
			const sorter = new PreferenceSorter(items);
			sorter.addPreference("Apple", "Banana", 1);
			expect(sorter.history.length).toBe(1);

			const success = sorter.undoLastPreference();
			expect(success).toBe(true);
			expect(sorter.history.length).toBe(0);
			expect(sorter.getPreference("Apple", "Banana")).toBe(0);
		});
	});
});

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
