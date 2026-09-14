import { describe, expect, it } from "vitest";
import { createSortedKey, shuffleArray } from "./utils";

describe("createSortedKey", () => {
	it("returns an empty string when given an empty array", () => {
		expect(createSortedKey([])).toBe("");
	});

	it("sorts array of strings lexicographically", () => {
		expect(createSortedKey(["banana", "apple", "cherry"])).toBe("apple,banana,cherry");
	});

	it("converts numbers to strings and sorts them lexicographically", () => {
		expect(createSortedKey([30, 10, 20])).toBe("10,20,30");
	});

	it("extracts id property from objects and sorts them", () => {
		const items = [{ id: "cat-3" }, { id: "cat-1" }, { id: "cat-2" }];
		expect(createSortedKey(items)).toBe("cat-1,cat-2,cat-3");
	});

	it("handles objects with numeric ids and sorts them lexicographically", () => {
		const items = [{ id: 102 }, { id: 15 }, { id: 42 }];
		expect(createSortedKey(items)).toBe("102,15,42");
	});

	it("handles mixed types of strings, numbers, and objects with id", () => {
		const items = ["zebra", 42, { id: "apple" }, { id: 10 }];
		expect(createSortedKey(items)).toBe("10,42,apple,zebra");
	});

	it("ignores null, undefined, empty strings, and 0 values", () => {
		const items = ["cat", null, undefined, "", 0, { id: "dog" }];
		expect(createSortedKey(items)).toBe("cat,dog");
	});

	it("produces deterministic output regardless of input order", () => {
		const arr1 = ["b", "a", { id: "c" }];
		const arr2 = [{ id: "c" }, "a", "b"];
		expect(createSortedKey(arr1)).toBe(createSortedKey(arr2));
	});
});

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
