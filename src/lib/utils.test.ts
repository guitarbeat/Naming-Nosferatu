import { afterEach, describe, expect, it, vi } from "vitest";
import { cn, createSortedKey, shuffleArray } from "./utils";

describe("cn", () => {
	it("merges single and multiple string class names", () => {
		expect(cn("px-2")).toBe("px-2");
		expect(cn("px-2", "py-2")).toBe("px-2 py-2");
	});

	it("handles conditional class names with boolean expressions", () => {
		const isTrue = true;
		const isFalse = false;
		expect(cn("px-2", isTrue && "bg-red-500", isFalse && "text-white")).toBe("px-2 bg-red-500");
	});

	it("handles object syntax for class names", () => {
		expect(cn({ "bg-blue-500": true, "text-black": false, "p-4": true })).toBe("bg-blue-500 p-4");
	});

	it("handles array syntax for class names", () => {
		expect(cn(["px-2", "py-2"], ["text-sm"])).toBe("px-2 py-2 text-sm");
	});

	it("filters out falsy values like null, undefined, empty strings, false, and 0", () => {
		expect(cn("px-2", null, undefined, false, "", 0)).toBe("px-2");
	});

	it("resolves conflicting Tailwind CSS classes via tailwind-merge", () => {
		expect(cn("px-2", "px-4")).toBe("px-4");
		expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
		expect(cn("text-red-500 text-sm", "text-blue-500 text-lg")).toBe("text-blue-500 text-lg");
	});

	it("handles complex mixed inputs with strings, arrays, objects, and conflicting classes", () => {
		const result = cn(
			"p-4",
			["text-red-500", { "bg-green-500": true, hidden: false }],
			"p-2",
			null,
			undefined,
		);
		expect(result).toBe("text-red-500 bg-green-500 p-2");
	});

	it("returns empty string when called with no arguments", () => {
		expect(cn()).toBe("");
	});

	it("deduplicates identical class names", () => {
		expect(cn("flex flex", "items-center items-center")).toBe("flex items-center");
	});

	it("handles deeply nested arrays and conditional objects", () => {
		expect(cn(["p-2", ["mt-4", [{ "text-center": true, "text-left": false }]]])).toBe(
			"p-2 mt-4 text-center",
		);
	});

	it("handles responsive and pseudo-class variant overrides correctly", () => {
		expect(cn("hover:bg-red-500", "hover:bg-blue-500")).toBe("hover:bg-blue-500");
		expect(cn("md:p-4", "md:p-8")).toBe("md:p-8");
		expect(cn("p-4 md:p-4", "p-2")).toBe("md:p-4 p-2");
	});
});

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

	it("handles duplicate values and retains duplicates in sorted order", () => {
		const items = ["cat", "dog", "cat", { id: "dog" }, { id: "apple" }];
		expect(createSortedKey(items)).toBe("apple,cat,cat,dog,dog");
	});

	it("handles objects missing an id property or having falsy id values", () => {
		const items = [
			{ id: "cat" },
			{ name: "no-id" } as unknown as { id: string },
			{ id: "" },
			{ id: 0 as unknown as string },
			{ id: null as unknown as string },
		];
		expect(createSortedKey(items)).toBe("cat");
	});

	it("handles boolean values and filters out falsy booleans while keeping truthy ones if cast", () => {
		const items = ["alpha", false, true] as unknown as Array<string>;
		expect(createSortedKey(items)).toBe("alpha,true");
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

	it("produces deterministic output when crypto.getRandomValues is mocked", () => {
		// Fisher-Yates loop runs for i = 4 down to 1:
		// i = 4 (max = 5): getRandomValues returns 0 -> j = 0 -> swap index 4 and 0
		// i = 3 (max = 4): getRandomValues returns 0 -> j = 0 -> swap index 3 and 0
		// i = 2 (max = 3): getRandomValues returns 0 -> j = 0 -> swap index 2 and 0
		// i = 1 (max = 2): getRandomValues returns 0 -> j = 0 -> swap index 1 and 0
		const mockGetRandomValues = vi
			.spyOn(crypto, "getRandomValues")
			.mockImplementation((array: ArrayBufferView) => {
				const uint32Arr = array as Uint32Array;
				uint32Arr[0] = 0;
				return array;
			});

		const input = [1, 2, 3, 4, 5];
		const result = shuffleArray(input);

		expect(mockGetRandomValues).toHaveBeenCalledTimes(4);
		expect(result).toEqual([2, 3, 4, 5, 1]);
	});

	it("falls back to Math.random when crypto is unavailable or getRandomValues is missing", () => {
		vi.stubGlobal("crypto", undefined);

		const mockMathRandom = vi
			.spyOn(Math, "random")
			.mockReturnValueOnce(0)
			.mockReturnValueOnce(0)
			.mockReturnValueOnce(0)
			.mockReturnValueOnce(0);

		const input = [1, 2, 3, 4, 5];
		const result = shuffleArray(input);

		expect(mockMathRandom).toHaveBeenCalledTimes(4);
		expect(result).toEqual([2, 3, 4, 5, 1]);

		vi.unstubAllGlobals();
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
