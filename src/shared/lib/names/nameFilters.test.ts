import { describe, expect, it } from "vitest";
import type { NameItem } from "@/shared/types";
import {
	getActiveNames,
	getHiddenNames,
	getLockedNames,
	getVisibleNames,
	isNameActive,
	isNameHidden,
	isNameLocked,
	matchesNameSearchTerm,
} from "./nameFilters";

describe("nameFilters predicates", () => {
	describe("isNameHidden", () => {
		it("reads both camelCase and snake_case hidden flags", () => {
			expect(isNameHidden({ id: 1, name: "Cat", isHidden: true } as NameItem)).toBe(true);
			expect(isNameHidden({ id: 2, name: "Cat", is_hidden: true } as NameItem)).toBe(true);
			expect(isNameHidden({ id: 3, name: "Cat" } as NameItem)).toBe(false);
		});

		it("returns false for explicitly false hidden flags", () => {
			expect(isNameHidden({ id: 4, name: "Cat", isHidden: false } as NameItem)).toBe(false);
			expect(isNameHidden({ id: 5, name: "Cat", is_hidden: false } as NameItem)).toBe(false);
		});

		it("returns false for null or undefined input", () => {
			expect(isNameHidden(null)).toBe(false);
			expect(isNameHidden(undefined)).toBe(false);
		});

		it("enforces strict boolean true", () => {
			// @ts-expect-error Testing invalid runtime inputs
			expect(isNameHidden({ id: 6, name: "Cat", isHidden: "true" })).toBe(false);
			// @ts-expect-error Testing invalid runtime inputs
			expect(isNameHidden({ id: 7, name: "Cat", is_hidden: 1 })).toBe(false);
		});
	});

	describe("isNameLocked", () => {
		it("reads both camelCase and snake_case locked flags", () => {
			expect(isNameLocked({ id: 1, name: "Cat", lockedIn: true } as NameItem)).toBe(true);
			expect(isNameLocked({ id: 2, name: "Cat", locked_in: true } as NameItem)).toBe(true);
			expect(isNameLocked({ id: 3, name: "Cat" } as NameItem)).toBe(false);
		});
	});

	describe("isNameActive", () => {
		it("returns true only when name is neither hidden nor locked", () => {
			expect(isNameActive({ id: 1, name: "Cat" } as NameItem)).toBe(true);
			expect(isNameActive({ id: 2, name: "Cat", isHidden: true } as NameItem)).toBe(false);
			expect(isNameActive({ id: 3, name: "Cat", lockedIn: true } as NameItem)).toBe(false);
			expect(
				isNameActive({ id: 4, name: "Cat", is_hidden: false, locked_in: false } as NameItem),
			).toBe(true);
		});
	});
});

describe("nameFilters helpers", () => {
	describe("getVisibleNames", () => {
		it("returns an empty array when input is null or undefined", () => {
			expect(getVisibleNames(null)).toEqual([]);
			expect(getVisibleNames(undefined)).toEqual([]);
		});

		it("returns an empty array when input is not an array", () => {
			// @ts-expect-error Testing invalid runtime inputs
			expect(getVisibleNames("not an array")).toEqual([]);
		});

		it("returns all items when none are hidden", () => {
			const names = [
				{ id: 1, name: "Mittens" },
				{ id: 2, name: "Socks", isHidden: false },
				{ id: 3, name: "Luna", is_hidden: false },
				{ id: 4, name: "Bella", isHidden: undefined, is_hidden: null },
			] as unknown as NameItem[];
			expect(getVisibleNames(names)).toEqual(names);
		});

		it("filters out items where isHidden is true", () => {
			const names = [
				{ id: 1, name: "Mittens", isHidden: true },
				{ id: 2, name: "Socks", isHidden: false },
			] as unknown as NameItem[];
			expect(getVisibleNames(names)).toEqual([{ id: 2, name: "Socks", isHidden: false }]);
		});
	});

	describe("getActiveNames", () => {
		it("returns visible, unlocked names", () => {
			const names = [
				{ id: 1, name: "Mittens", isHidden: false },
				{ id: 2, name: "Socks", isHidden: true },
				{ id: 3, name: "Luna", lockedIn: true },
			] as unknown as NameItem[];
			expect(getActiveNames(names).map((name) => name.id)).toEqual([1]);
		});
	});

	describe("getHiddenNames", () => {
		it("returns only hidden names", () => {
			const names = [
				{ id: 1, name: "Mittens", is_hidden: true },
				{ id: 2, name: "Socks", isHidden: false },
			] as unknown as NameItem[];
			expect(getHiddenNames(names).map((name) => name.id)).toEqual([1]);
		});
	});

	describe("getLockedNames", () => {
		it("returns only locked names", () => {
			const names = [
				{ id: 1, name: "Mittens", locked_in: true },
				{ id: 2, name: "Socks", lockedIn: false },
			] as unknown as NameItem[];
			expect(getLockedNames(names).map((name) => name.id)).toEqual([1]);
		});
	});

	describe("matchesNameSearchTerm", () => {
		const catName = { id: 1, name: "Mittens", description: "Fluffy orange cat" } as NameItem;

		it("matches on name and description", () => {
			expect(matchesNameSearchTerm(catName, "Mittens")).toBe(true);
			expect(matchesNameSearchTerm(catName, "orange")).toBe(true);
			expect(matchesNameSearchTerm(catName, "absent")).toBe(false);
		});

		it("handles empty search terms and null-safe inputs", () => {
			expect(matchesNameSearchTerm(catName, "")).toBe(true);
			expect(matchesNameSearchTerm(null, "cat")).toBe(false);
		});
	});
});
