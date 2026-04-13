import { describe, expect, it } from "vitest";
import { cn, shuffleArray } from "./basic";

describe("cn", () => {
	it("merges basic classes", () => {
		expect(cn("class1", "class2")).toBe("class1 class2");
	});

	it("merges conditional classes", () => {
		expect(cn("class1", true && "class2", false && "class3")).toBe("class1 class2");
	});

	it("merges and overrides tailwind classes correctly", () => {
		expect(cn("px-2 py-1", "p-4")).toBe("p-4");
		expect(cn("text-sm", "text-lg")).toBe("text-lg");
		expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
	});

	it("handles arrays and objects", () => {
		expect(cn(["class1", "class2"])).toBe("class1 class2");
		expect(cn({ class1: true, class2: false, class3: true })).toBe("class1 class3");
		expect(cn(["class1"], { class2: true })).toBe("class1 class2");
	});

	it("ignores falsy values", () => {
		expect(cn("class1", null, undefined, false, 0, "", "class2")).toBe("class1 class2");
	});
});

describe("shuffleArray", () => {
	it("returns a new array with the same elements", () => {
		const input = [1, 2, 3, 4, 5];
		const result = shuffleArray(input);
		expect(result).not.toBe(input);
		expect(result.sort()).toEqual(input.sort());
	});

	it("handles empty arrays", () => {
		expect(shuffleArray([])).toEqual([]);
	});

	it("handles single-element arrays", () => {
		expect(shuffleArray([1])).toEqual([1]);
	});
});
