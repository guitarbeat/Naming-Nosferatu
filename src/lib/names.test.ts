import { describe, expect, it } from "vitest";
import type { NameItem } from "@/types";
import {
	DEFAULT_SAMPLE_NAMES,
	getActiveNames,
	getHiddenNames,
	getLockedNames,
	getVisibleNames,
	isNameActive,
	isNameHidden,
	isNameLocked,
	matchesNameSearchTerm,
	normalizeRatingsWithStats,
} from "./names";

describe("names utility", () => {
	it("contains valid default sample names", () => {
		expect(DEFAULT_SAMPLE_NAMES.length).toBeGreaterThan(0);
		const ids = new Set(DEFAULT_SAMPLE_NAMES.map((n) => n.id));
		expect(ids.size).toBe(DEFAULT_SAMPLE_NAMES.length);
	});

	describe("normalizeRatingsWithStats", () => {
		it("handles null and undefined input", () => {
			expect(normalizeRatingsWithStats(null)).toEqual({});
			expect(normalizeRatingsWithStats(undefined)).toEqual({});
		});

		it("normalizes numeric ratings into RatingData objects", () => {
			const result = normalizeRatingsWithStats({ "1": 1600 });
			expect(result["1"]).toEqual({ rating: 1600, wins: 0, losses: 0 });
		});

		it("normalizes object ratings with defaults", () => {
			const result = normalizeRatingsWithStats({
				"1": { rating: 1750, wins: 5, losses: 2 },
				"2": { rating: 1500, wins: 3, losses: 1 },
			});
			expect(result["1"]).toEqual({ rating: 1750, wins: 5, losses: 2 });
			expect(result["2"]).toEqual({ rating: 1500, wins: 3, losses: 1 });
		});
	});

	describe("visibility and status helpers", () => {
		const activeItem: NameItem = { id: "1", name: "Active Cat" };
		const hiddenCamel: NameItem = { id: "2", name: "Hidden Cat 1", isHidden: true };
		const hiddenSnake: NameItem = { id: "3", name: "Hidden Cat 2", is_hidden: true };
		const lockedCamel: NameItem = { id: "4", name: "Locked Cat 1", lockedIn: true };
		const lockedSnake: NameItem = { id: "5", name: "Locked Cat 2", locked_in: true };

		it("correctly identifies hidden names", () => {
			expect(isNameHidden(activeItem)).toBe(false);
			expect(isNameHidden(hiddenCamel)).toBe(true);
			expect(isNameHidden(hiddenSnake)).toBe(true);
			expect(isNameHidden(null)).toBe(false);
		});

		it("correctly identifies locked names", () => {
			expect(isNameLocked(activeItem)).toBe(false);
			expect(isNameLocked(lockedCamel)).toBe(true);
			expect(isNameLocked(lockedSnake)).toBe(true);
			expect(isNameLocked(null)).toBe(false);
		});

		it("correctly identifies active names", () => {
			expect(isNameActive(activeItem)).toBe(true);
			expect(isNameActive(hiddenCamel)).toBe(false);
			expect(isNameActive(hiddenSnake)).toBe(false);
			expect(isNameActive(lockedCamel)).toBe(false);
			expect(isNameActive(lockedSnake)).toBe(false);
			expect(isNameActive(null)).toBe(false);
		});

		it("filters lists of names correctly", () => {
			const list = [activeItem, hiddenCamel, hiddenSnake, lockedCamel, lockedSnake];
			expect(getVisibleNames(list)).toEqual([activeItem, lockedCamel, lockedSnake]);
			expect(getActiveNames(list)).toEqual([activeItem]);
			expect(getHiddenNames(list)).toEqual([hiddenCamel, hiddenSnake]);
			expect(getLockedNames(list)).toEqual([lockedCamel, lockedSnake]);
		});
	});

	describe("matchesNameSearchTerm", () => {
		const item: NameItem = {
			id: "1",
			name: "Nosferatu",
			description: "Immortal feline count",
		};

		it("matches by name substring case-insensitively", () => {
			expect(matchesNameSearchTerm(item, "nosferatu")).toBe(true);
			expect(matchesNameSearchTerm(item, "NOS")).toBe(true);
			expect(matchesNameSearchTerm(item, "feratu")).toBe(true);
		});

		it("matches by description substring", () => {
			expect(matchesNameSearchTerm(item, "immortal")).toBe(true);
			expect(matchesNameSearchTerm(item, "COUNT")).toBe(true);
		});

		it("returns true for empty or whitespace search terms", () => {
			expect(matchesNameSearchTerm(item, "")).toBe(true);
			expect(matchesNameSearchTerm(item, "   ")).toBe(true);
		});

		it("returns false for non-matching queries or missing items", () => {
			expect(matchesNameSearchTerm(item, "tiger")).toBe(false);
			expect(matchesNameSearchTerm(null, "nos")).toBe(false);
		});
	});
});
