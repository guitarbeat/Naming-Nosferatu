import { describe, expect, it } from "vitest";
import type { NameItem } from "@/shared/types";
import { getVisibleNames, isNameHidden } from "./basic";

describe("basic.ts", () => {
	describe("isNameHidden", () => {
		it("returns true if isHidden is true", () => {
			const item = { id: 1, name: "Test", isHidden: true } as unknown as NameItem;
			expect(isNameHidden(item)).toBe(true);
		});

		it("returns true if is_hidden is true", () => {
			const item = { id: 1, name: "Test", is_hidden: true } as unknown as NameItem;
			expect(isNameHidden(item)).toBe(true);
		});

		it("returns true if both are true", () => {
			const item = { id: 1, name: "Test", isHidden: true, is_hidden: true } as unknown as NameItem;
			expect(isNameHidden(item)).toBe(true);
		});

		it("returns true if mixed (one true, one false)", () => {
			const item1 = {
				id: 1,
				name: "Test",
				isHidden: true,
				is_hidden: false,
			} as unknown as NameItem;
			const item2 = {
				id: 1,
				name: "Test",
				isHidden: false,
				is_hidden: true,
			} as unknown as NameItem;
			expect(isNameHidden(item1)).toBe(true);
			expect(isNameHidden(item2)).toBe(true);
		});

		it("returns false if neither is true", () => {
			const item = { id: 1, name: "Test" } as unknown as NameItem;
			expect(isNameHidden(item)).toBe(false);
		});

		it("returns false if explicitly false", () => {
			const item = {
				id: 1,
				name: "Test",
				isHidden: false,
				is_hidden: false,
			} as unknown as NameItem;
			expect(isNameHidden(item)).toBe(false);
		});

		it("returns false for null or undefined input", () => {
			expect(isNameHidden(null)).toBe(false);
			expect(isNameHidden(undefined)).toBe(false);
		});
	});

	describe("getVisibleNames", () => {
		it("filters out hidden names", () => {
			const names: NameItem[] = [
				{ id: 1, name: "Visible", isHidden: false } as NameItem,
				{ id: 2, name: "Hidden", isHidden: true } as NameItem,
				{ id: 3, name: "Hidden Snake", is_hidden: true } as NameItem,
				{ id: 4, name: "Visible Snake", is_hidden: false } as NameItem,
			];
			const result = getVisibleNames(names);
			expect(result).toHaveLength(2);
			expect(result.map((n) => n.id)).toEqual([1, 4]);
		});

		it("returns empty array for null/undefined input", () => {
			expect(getVisibleNames(null)).toEqual([]);
			expect(getVisibleNames(undefined)).toEqual([]);
		});

		it("returns empty array if input is not an array", () => {
			// @ts-expect-error Testing runtime check
			expect(getVisibleNames("not an array" as any)).toEqual([]);
		});
	});
});
