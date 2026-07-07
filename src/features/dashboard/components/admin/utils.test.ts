import { describe, expect, it } from "vitest";
import type { NameWithStats } from "./types";
import { filterNamesByStatusAndSearch } from "./utils";

describe("admin utils - filterNamesByStatusAndSearch", () => {
	const mockNames: NameWithStats[] = [
		{
			id: 1,
			name: "ActiveName1",
			description: "First active",
			isHidden: false,
			lockedIn: false,
			createdAt: "2024-01-01",
		},
		{
			id: 2,
			name: "ActiveName2",
			description: "Second active",
			isHidden: false,
			lockedIn: false,
			createdAt: "2024-01-02",
		},
		{
			id: 3,
			name: "HiddenName",
			description: "A hidden item",
			isHidden: true,
			lockedIn: false,
			createdAt: "2024-01-03",
		},
		{
			id: 4,
			name: "LockedName",
			description: "A locked item",
			isHidden: false,
			lockedIn: true,
			createdAt: "2024-01-04",
		},
		{
			id: 5,
			name: "HiddenLockedName",
			description: "Hidden and locked",
			isHidden: true,
			lockedIn: true,
			createdAt: "2024-01-05",
		},
	];

	describe("Status Filtering", () => {
		it("should return all names when filterStatus is 'all'", () => {
			const result = filterNamesByStatusAndSearch(mockNames, "all", "");
			expect(result).toHaveLength(5);
			expect(result).toEqual(mockNames);
		});

		it("should return only active names (not hidden, not locked) when filterStatus is 'active'", () => {
			const result = filterNamesByStatusAndSearch(mockNames, "active", "");
			expect(result).toHaveLength(2);
			expect(result.map((n) => n.id)).toEqual([1, 2]);
		});

		it("should return only hidden names when filterStatus is 'hidden'", () => {
			const result = filterNamesByStatusAndSearch(mockNames, "hidden", "");
			expect(result).toHaveLength(2);
			expect(result.map((n) => n.id)).toEqual([3, 5]);
		});

		it("should return only locked names when filterStatus is 'locked'", () => {
			const result = filterNamesByStatusAndSearch(mockNames, "locked", "");
			expect(result).toHaveLength(2);
			expect(result.map((n) => n.id)).toEqual([4, 5]);
		});
	});

	describe("Search Term Filtering", () => {
		it("should filter by search term in name (case-insensitive)", () => {
			const result = filterNamesByStatusAndSearch(mockNames, "all", "activename");
			expect(result).toHaveLength(2);
			expect(result.map((n) => n.id)).toEqual([1, 2]);
		});

		it("should filter by search term in description (case-insensitive)", () => {
			const result = filterNamesByStatusAndSearch(mockNames, "all", "hidden item");
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe(3);
		});

		it("should ignore surrounding whitespace in search term", () => {
			const result = filterNamesByStatusAndSearch(mockNames, "all", "  locked  ");
			expect(result).toHaveLength(2);
			expect(result.map((n) => n.id)).toEqual([4, 5]);
		});

		it("should return empty array if no matches found", () => {
			const result = filterNamesByStatusAndSearch(mockNames, "all", "nonexistent");
			expect(result).toHaveLength(0);
		});
	});

	describe("Combined Filtering", () => {
		it("should apply both status filter and search term correctly", () => {
			// Search for "name" but only in active status
			const result = filterNamesByStatusAndSearch(mockNames, "active", "name");
			expect(result).toHaveLength(2);
			expect(result.map((n) => n.id)).toEqual([1, 2]);

			// Search for "name" but only in hidden status
			const resultHidden = filterNamesByStatusAndSearch(mockNames, "hidden", "name");
			expect(resultHidden).toHaveLength(2);
			expect(resultHidden.map((n) => n.id)).toEqual([3, 5]);
		});

		it("should return empty array if status matches but search doesn't", () => {
			const result = filterNamesByStatusAndSearch(mockNames, "active", "locked");
			expect(result).toHaveLength(0);
		});

		it("should return empty array if search matches but status doesn't", () => {
			const result = filterNamesByStatusAndSearch(mockNames, "locked", "first active");
			expect(result).toHaveLength(0);
		});
	});
});
