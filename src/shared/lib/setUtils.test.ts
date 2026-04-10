import { describe, expect, it } from "vitest";
import { addManyToSet, addToSet, removeFromSet, toggleInSet } from "./setUtils";

describe("setUtils", () => {
	it("adds and removes values without mutating the original set", () => {
		const original = new Set([1, 2]);

		const added = addToSet(original, 3);
		const removed = removeFromSet(added, 2);

		expect(original).toEqual(new Set([1, 2]));
		expect(added).toEqual(new Set([1, 2, 3]));
		expect(removed).toEqual(new Set([1, 3]));
	});

	it("toggles values in a set", () => {
		expect(toggleInSet(new Set([1, 2]), 2)).toEqual(new Set([1]));
		expect(toggleInSet(new Set([1, 2]), 3)).toEqual(new Set([1, 2, 3]));
	});

	it("adds multiple values in one pass", () => {
		expect(addManyToSet(new Set([1]), [1, 2, 3])).toEqual(new Set([1, 2, 3]));
	});
});
