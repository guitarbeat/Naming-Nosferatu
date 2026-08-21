import { describe, expect, it } from "vitest";
import { haveSameIds } from "./useTournamentState";

describe("haveSameIds", () => {
	it("returns false for arrays of different lengths", () => {
		expect(haveSameIds(["a"], ["a", "b"])).toBe(false);
	});

	it("returns true for identical arrays in the same order", () => {
		expect(haveSameIds(["a", "b", "c"], ["a", "b", "c"])).toBe(true);
	});

	it("returns true for arrays with the same elements in a different order", () => {
		expect(haveSameIds(["a", "b", "c"], ["c", "a", "b"])).toBe(true);
	});

	it("returns false for arrays with different elements", () => {
		expect(haveSameIds(["a", "b", "c"], ["a", "b", "d"])).toBe(false);
	});

	it("handles arrays with duplicate elements correctly", () => {
		expect(haveSameIds(["a", "a", "b"], ["a", "b", "a"])).toBe(true);
		expect(haveSameIds(["a", "a", "b"], ["a", "b", "b"])).toBe(false);
	});

	it("handles empty arrays", () => {
		expect(haveSameIds([], [])).toBe(true);
	});
});
