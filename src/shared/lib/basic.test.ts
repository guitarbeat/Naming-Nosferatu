import { describe, expect, it } from "vitest";
import { type RatingDataInput, type RatingItem, ratingsToArray } from "./basic";

describe("ratingsToArray", () => {
	it("should return the input array if the input is already an array", () => {
		const input: RatingItem[] = [
			{ name: "cat1", rating: 1200, wins: 5, losses: 2 },
			{ name: "cat2", rating: 1500, wins: 0, losses: 0 },
		];
		const result = ratingsToArray(input);
		expect(result).toBe(input); // Should be the same reference
		expect(result).toEqual(input);
	});

	it("should return an empty array if the input is an empty array", () => {
		const input: RatingItem[] = [];
		const result = ratingsToArray(input);
		expect(result).toEqual([]);
		expect(result).toBe(input);
	});

	it("should convert a record of numbers to an array of RatingItems with default wins/losses", () => {
		const input: Record<string, number> = {
			cat1: 1200,
			cat2: 1500,
		};
		const result = ratingsToArray(input);
		expect(result).toEqual([
			{ name: "cat1", rating: 1200, wins: 0, losses: 0 },
			{ name: "cat2", rating: 1500, wins: 0, losses: 0 },
		]);
	});

	it("should convert a record of RatingDataInput objects to an array of RatingItems", () => {
		const input: Record<string, RatingDataInput> = {
			cat1: { rating: 1300, wins: 10, losses: 5 },
			cat2: { rating: 1400, wins: 2, losses: 1 },
		};
		const result = ratingsToArray(input);
		// Sort or check contents regardless of order, though Object.entries usually preserves insertion order for string keys
		// To be safe, let's find by name
		expect(result).toHaveLength(2);
		expect(result).toContainEqual({ name: "cat1", rating: 1300, wins: 10, losses: 5 });
		expect(result).toContainEqual({ name: "cat2", rating: 1400, wins: 2, losses: 1 });
	});

	it("should handle mixed number and object inputs in the record", () => {
		const input: Record<string, RatingDataInput | number> = {
			cat1: 1200,
			cat2: { rating: 1400, wins: 2, losses: 1 },
		};
		const result = ratingsToArray(input);
		expect(result).toHaveLength(2);
		expect(result).toContainEqual({ name: "cat1", rating: 1200, wins: 0, losses: 0 });
		expect(result).toContainEqual({ name: "cat2", rating: 1400, wins: 2, losses: 1 });
	});

	it("should use default values for missing fields in RatingDataInput objects", () => {
		const input: Record<string, RatingDataInput> = {
			cat1: { rating: 1600 }, // Missing wins/losses
			cat2: { rating: 1500, wins: 5 }, // Missing losses
		};
		const result = ratingsToArray(input);
		expect(result).toContainEqual({ name: "cat1", rating: 1600, wins: 0, losses: 0 });
		expect(result).toContainEqual({ name: "cat2", rating: 1500, wins: 5, losses: 0 });
	});

	it("should return empty array for empty object", () => {
		const input: Record<string, RatingDataInput | number> = {};
		const result = ratingsToArray(input);
		expect(result).toEqual([]);
	});

	it("should handle null values in record gracefully (treat as default)", () => {
		const input: any = {
			cat1: null,
		};
		const result = ratingsToArray(input);
		expect(result).toEqual([{ name: "cat1", rating: 1500, wins: 0, losses: 0 }]);
	});
});
