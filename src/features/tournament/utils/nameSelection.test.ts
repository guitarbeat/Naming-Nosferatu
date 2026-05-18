import { describe, expect, it } from "vitest";
import { addManyToSet, addToSet, removeFromSet, toggleInSet } from "@/shared/lib/setUtils";
import type { NameItem } from "@/shared/types";
import { buildNameCardImages, countSelectedItems, pickRandomItemIds } from "./nameSelection";

describe("nameSelection helpers", () => {
	it("adds and removes ids without mutating the original set", () => {
		const original = new Set([1, 2]);

		const added = addToSet(original, 3);
		const removed = removeFromSet(added, 2);

		expect(original).toEqual(new Set([1, 2]));
		expect(added).toEqual(new Set([1, 2, 3]));
		expect(removed).toEqual(new Set([1, 3]));
	});

	it("toggles ids in a set", () => {
		expect(toggleInSet(new Set([1, 2]), 2)).toEqual(new Set([1]));
		expect(toggleInSet(new Set([1, 2]), 3)).toEqual(new Set([1, 2, 3]));
	});

	it("adds multiple ids in one pass", () => {
		expect(addManyToSet(new Set([1]), [1, 2, 3])).toEqual(new Set([1, 2, 3]));
	});

	it("counts how many visible items are selected", () => {
		const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
		const selected = new Set([2, 3, 4]);

		expect(countSelectedItems(items, selected)).toBe(2);
	});

	it("picks a unique random subset of item ids", () => {
		const items = [
			{ id: 1, label: "One" },
			{ id: 2, label: "Two" },
			{ id: 3, label: "Three" },
		];

		const picked = pickRandomItemIds(items, 2);

		expect(picked.size).toBe(2);
		expect([...picked].every((id) => items.some((item) => item.id === id))).toBe(true);
	});

	it("builds a stable image lookup for rendered cards", () => {
		const names = [
			{ id: "alpha", name: "Alpha" },
			{ id: "beta", name: "Beta" },
		] as NameItem[];

		const { catImages, catImageById } = buildNameCardImages(names);

		expect(catImages).toHaveLength(2);
		expect(catImageById.get("alpha")).toBe(catImages[0]);
		expect(catImageById.get("beta")).toBe(catImages[1]);
	});
});
