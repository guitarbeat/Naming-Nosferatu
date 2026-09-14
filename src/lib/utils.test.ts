import { afterEach, describe, expect, it, vi } from "vitest";
import { shuffleArray } from "./utils";

describe("shuffleArray", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns a new array and does not mutate the original array", () => {
		const original = [1, 2, 3, 4, 5];
		const originalCopy = [...original];
		const result = shuffleArray(original);

		expect(result).not.toBe(original);
		expect(original).toEqual(originalCopy);
	});

	it("preserves array length and all elements", () => {
		const input = ["a", "b", "c", "d", "e"];
		const result = shuffleArray(input);

		expect(result).toHaveLength(input.length);
		expect(result.sort()).toEqual([...input].sort());
	});

	it("handles an empty array", () => {
		const input: number[] = [];
		const result = shuffleArray(input);

		expect(result).toEqual([]);
		expect(result).not.toBe(input);
	});

	it("handles a single-element array", () => {
		const input = [42];
		const result = shuffleArray(input);

		expect(result).toEqual([42]);
		expect(result).not.toBe(input);
	});

	it("produces deterministic output when Math.random is mocked", () => {
		// Mock Math.random to return predictable values
		// Fisher-Yates loop runs for i = 4 down to 1:
		// i = 4: Math.floor(0.1 * 5) = 0 -> swap index 4 and 0
		// i = 3: Math.floor(0.2 * 4) = 0 -> swap index 3 and 0
		// i = 2: Math.floor(0.3 * 3) = 0 -> swap index 2 and 0
		// i = 1: Math.floor(0.4 * 2) = 0 -> swap index 1 and 0
		const mockRandom = vi
			.spyOn(Math, "random")
			.mockReturnValueOnce(0.1)
			.mockReturnValueOnce(0.2)
			.mockReturnValueOnce(0.3)
			.mockReturnValueOnce(0.4);

		const input = [1, 2, 3, 4, 5];
		const result = shuffleArray(input);

		expect(mockRandom).toHaveBeenCalledTimes(4);
		// Let's trace the swaps:
		// start: [1, 2, 3, 4, 5]
		// i=4, j=0: swap index 4 (5) and 0 (1) => [5, 2, 3, 4, 1]
		// i=3, j=0: swap index 3 (4) and 0 (5) => [4, 2, 3, 5, 1]
		// i=2, j=0: swap index 2 (3) and 0 (4) => [3, 2, 4, 5, 1]
		// i=1, j=0: swap index 1 (2) and 0 (3) => [2, 3, 4, 5, 1]
		expect(result).toEqual([2, 3, 4, 5, 1]);
	});

	it("works correctly with arrays of objects", () => {
		const obj1 = { id: 1, name: "Cat A" };
		const obj2 = { id: 2, name: "Cat B" };
		const obj3 = { id: 3, name: "Cat C" };

		const input = [obj1, obj2, obj3];
		const result = shuffleArray(input);

		expect(result).toHaveLength(3);
		expect(result).toContain(obj1);
		expect(result).toContain(obj2);
		expect(result).toContain(obj3);
	});
});
