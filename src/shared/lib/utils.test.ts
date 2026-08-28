import { describe, expect, it } from "vitest";
import {
	addManyToSet,
	addToSet,
	cn,
	createSortedKey,
	removeFromSet,
	shuffleArray,
	toggleInSet,
} from "./utils";

describe("shared utils", () => {
	describe("cn", () => {
		it("merges class names and handles conditionals", () => {
			expect(cn("bg-red-500", true && "text-white", false && "hidden")).toBe(
				"bg-red-500 text-white",
			);
		});

		it("resolves tailwind conflicts correctly", () => {
			expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
		});
	});

	describe("createSortedKey", () => {
		it("sorts array of keys consistently", () => {
			expect(createSortedKey(["b", "c", "a"])).toBe("a,b,c");
		});
	});

	describe("shuffleArray", () => {
		it("preserves array elements without mutating original", () => {
			const original = ["1", "2", "3", "4", "5"];
			const shuffled = shuffleArray(original);
			expect(shuffled).toHaveLength(original.length);
			expect([...shuffled].sort()).toEqual([...original].sort());
		});
	});

	describe("Set utilities", () => {
		it("addToSet immutably adds values", () => {
			const initial = new Set(["a", "b"]);
			const next = addToSet(initial, "c");
			expect(next.has("c")).toBe(true);
			expect(initial.has("c")).toBe(false);
		});

		it("addManyToSet immutably adds multiple values", () => {
			const initial = new Set(["a"]);
			const next = addManyToSet(initial, ["b", "c"]);
			expect(next.size).toBe(3);
			expect(initial.size).toBe(1);
		});

		it("removeFromSet immutably deletes values", () => {
			const initial = new Set(["a", "b"]);
			const next = removeFromSet(initial, "a");
			expect(next.has("a")).toBe(false);
			expect(initial.has("a")).toBe(true);
		});

		it("toggleInSet toggles presence of values", () => {
			const initial = new Set(["a"]);
			const withB = toggleInSet(initial, "b");
			expect(withB.has("b")).toBe(true);
			const withoutB = toggleInSet(withB, "b");
			expect(withoutB.has("b")).toBe(false);
		});
	});
});
