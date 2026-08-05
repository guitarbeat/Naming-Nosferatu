import { describe, expect, it } from "vitest";
import type { NameItem } from "@/shared/types";
import type { NameWithStats, SiteStatsLike } from "./types";
import {
	buildAdminStats,
	filterNamesByStatusAndSearch,
	mapNameToDisplay,
} from "./utils";

describe("admin utils - mapNameToDisplay", () => {
	it("maps name correctly with wins and losses", () => {
		const name: NameItem = {
			id: "1",
			name: "Oliver",
			wins: 10,
			losses: 5,
			popularity_score: 8.5,
		};

		const expected: NameWithStats = {
			...name,
			votes: 15,
			lastVoted: undefined,
			popularityScore: 8.5,
		};

		expect(mapNameToDisplay(name)).toEqual(expected);
	});

	it("handles missing wins and losses defaulting to 0", () => {
		const name: NameItem = {
			id: "2",
			name: "Emma",
		};

		const expected: NameWithStats = {
			...name,
			votes: 0,
			lastVoted: undefined,
			popularityScore: 0,
		};

		expect(mapNameToDisplay(name)).toEqual(expected);
	});

	it("handles missing popularity_score defaulting to 0", () => {
		const name: NameItem = {
			id: "3",
			name: "Liam",
			wins: 2,
			losses: 0,
		};

		const expected: NameWithStats = {
			...name,
			votes: 2,
			lastVoted: undefined,
			popularityScore: 0,
		};

		expect(mapNameToDisplay(name)).toEqual(expected);
	});
});

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
			const result = filterNamesByStatusAndSearch(
				mockNames,
				"all",
				"activename",
			);
			expect(result).toHaveLength(2);
			expect(result.map((n) => n.id)).toEqual([1, 2]);
		});

		it("should filter by search term in description (case-insensitive)", () => {
			const result = filterNamesByStatusAndSearch(
				mockNames,
				"all",
				"hidden item",
			);
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe(3);
		});

		it("should ignore surrounding whitespace in search term", () => {
			const result = filterNamesByStatusAndSearch(
				mockNames,
				"all",
				"  locked  ",
			);
			expect(result).toHaveLength(2);
			expect(result.map((n) => n.id)).toEqual([4, 5]);
		});

		it("should return empty array if no matches found", () => {
			const result = filterNamesByStatusAndSearch(
				mockNames,
				"all",
				"nonexistent",
			);
			expect(result).toHaveLength(0);
		});
	});

	describe("Combined Filtering", () => {
		it("should apply both status filter and search term correctly", () => {
			const result = filterNamesByStatusAndSearch(mockNames, "active", "name");
			expect(result).toHaveLength(2);
			expect(result.map((n) => n.id)).toEqual([1, 2]);

			const resultHidden = filterNamesByStatusAndSearch(
				mockNames,
				"hidden",
				"name",
			);
			expect(resultHidden).toHaveLength(2);
			expect(resultHidden.map((n) => n.id)).toEqual([3, 5]);
		});

		it("should return empty array if status matches but search doesn't", () => {
			const result = filterNamesByStatusAndSearch(
				mockNames,
				"active",
				"locked",
			);
			expect(result).toHaveLength(0);
		});

		it("should return empty array if search matches but status doesn't", () => {
			const result = filterNamesByStatusAndSearch(
				mockNames,
				"locked",
				"first active",
			);
			expect(result).toHaveLength(0);
		});
	});

	describe("Edge Cases", () => {
		it("should return empty array if input array is empty", () => {
			const result = filterNamesByStatusAndSearch([], "all", "");
			expect(result).toHaveLength(0);
		});

		it("should fallback gracefully if an unknown filterStatus is cast to NameFilter", () => {
			// @ts-expect-error Testing runtime resilience
			const result = filterNamesByStatusAndSearch(
				mockNames,
				"unknown_status",
				"",
			);
			expect(result).toHaveLength(5);
			expect(result).toEqual(mockNames);
		});

		it("should safely handle names without a description when searching", () => {
			const namesWithoutDescription = [
				{
					...mockNames[0],
					description: undefined,
				},
			];
			const result = filterNamesByStatusAndSearch(
				namesWithoutDescription,
				"all",
				"activename",
			);
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe(1);
		});
	});
});

describe("buildAdminStats", () => {
	it("returns all zeros when lists are empty and stats are null", () => {
		const result = buildAdminStats([], null);
		expect(result).toEqual({
			totalNames: 0,
			activeNames: 0,
			hiddenNames: 0,
			lockedInNames: 0,
			totalUsers: 0,
			recentVotes: 0,
		});
	});

	it("calculates active, hidden, and locked names correctly", () => {
		const names = [
			{ id: "1", name: "Active1", isHidden: false, lockedIn: false },
			{ id: "2", name: "Active2", isHidden: false },
			{ id: "3", name: "Hidden1", isHidden: true, lockedIn: false },
			{ id: "4", name: "Locked1", isHidden: false, lockedIn: true },
			{ id: "5", name: "HiddenAndLocked", isHidden: true, lockedIn: true },
		] as unknown as NameWithStats[];

		const siteStats: SiteStatsLike = {
			totalUsers: 42,
			totalRatings: 100,
		};

		const result = buildAdminStats(names, siteStats);

		expect(result).toEqual({
			totalNames: 5,
			activeNames: 2,
			hiddenNames: 2,
			lockedInNames: 2,
			totalUsers: 42,
			recentVotes: 100,
		});
	});

	it("handles site stats missing values safely", () => {
		const result = buildAdminStats([], {
			totalUsers: undefined,
			totalRatings: null,
		} as unknown as SiteStatsLike);

		expect(result.totalUsers).toBe(0);
		expect(result.recentVotes).toBe(0);
	});

	it("handles string values in siteStats gracefully via toNumber", () => {
		const result = buildAdminStats([], {
			totalUsers: "55",
			totalRatings: "230",
		} as unknown as SiteStatsLike);

		expect(result.totalUsers).toBe(55);
		expect(result.recentVotes).toBe(230);
	});

	it("handles invalid number values in siteStats by returning 0", () => {
		const result = buildAdminStats([], {
			totalUsers: "invalid",
			totalRatings: {},
		} as unknown as SiteStatsLike);

		expect(result.totalUsers).toBe(0);
		expect(result.recentVotes).toBe(0);
	});
});
