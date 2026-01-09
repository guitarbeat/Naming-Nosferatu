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

describe("computeRating", () => {
	it("should return existing rating when matchesPlayed is 0", () => {
		// blendFactor = min(0.8, (0 / safeMax) * 0.9) = 0
		// result = 0 * newPos + 1 * existing
		const result = computeRating(1500, 2000, 0, 100);
		expect(result).toBe(1500);
	});

	it("should blend ratings based on matches played", () => {
		// safeMax = 100
		// matches = 50
		// blendFactor = min(0.8, (50/100) * 0.9) = 0.45
		// rating = 0.45 * 2000 + 0.55 * 1000 = 900 + 550 = 1450
		// clamped between 1000 and 2000
		const result = computeRating(1000, 2000, 50, 100);
		expect(result).toBe(1450);
	});

	it("should clamp matchesPlayed to maxMatches", () => {
		// Case 1: matchesPlayed = maxMatches = 100
		// blendFactor = min(0.8, (100/100) * 0.9) = 0.9 -> capped at 0.8
		// rating = 0.8 * 2000 + 0.2 * 1000 = 1600 + 200 = 1800
		const resultNormal = computeRating(1000, 2000, 100, 100);
		expect(resultNormal).toBe(1800);

		// Case 2: matchesPlayed = 200, maxMatches = 100
		// If clamped correctly, this should behave exactly as matchesPlayed = 100
		const resultExcess = computeRating(1000, 2000, 200, 100);
		expect(resultExcess).toBe(1800);
	});

	it("should respect min/max rating bounds", () => {
		// Potential result < 1000
		// blendFactor = 0 (matches=0)
		// result = existing(500) -> should be clamped to 1000
		expect(computeRating(500, 500, 0, 100)).toBe(1000);

		// Potential result > 2000
		// blendFactor = 0 (matches=0)
		// result = existing(2500) -> should be clamped to 2000
		expect(computeRating(2500, 2500, 0, 100)).toBe(2000);
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
