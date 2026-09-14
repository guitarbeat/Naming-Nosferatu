import { describe, expect, it } from "vitest";
import { createSortedKey } from "./utils";

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
