import { describe, expect, it } from "vitest";
import type { NameItem } from "@/shared/types";
import { getVisibleNames } from "./basic";

describe("getVisibleNames", () => {
	it("returns a new array reference on every call", () => {
		const names: NameItem[] = [
			{ id: 1, name: "Cat 1", isHidden: false },
			{ id: 2, name: "Cat 2", isHidden: false },
		];

		const result1 = getVisibleNames(names);
		const result2 = getVisibleNames(names);

		expect(result1).not.toBe(names); // Should be a new array (shallow copy via filter)
		expect(result1).not.toBe(result2); // Different references
		expect(result1).toEqual(result2); // Same content
	});

	it("filters hidden names correctly", () => {
		const names: NameItem[] = [
			{ id: 1, name: "Visible", isHidden: false },
			{ id: 2, name: "Hidden", isHidden: true },
		];

		const result = getVisibleNames(names);
		expect(result.length).toBe(1);
    expect(result[0]?.name).toBe("Visible");
	});
});
