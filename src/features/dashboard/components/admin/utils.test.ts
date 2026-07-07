import { describe, expect, it } from "vitest";
import type { NameItem } from "@/shared/types";
import type { NameWithStats } from "./types";
import {
	buildAdminStats,
	filterNamesByStatusAndSearch,
	mapNameToDisplay,
} from "./utils";

describe("admin utils", () => {
	describe("mapNameToDisplay", () => {
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

	describe("buildAdminStats", () => {
		it("builds stats correctly based on active, hidden, locked filters", () => {
			const names: NameWithStats[] = [
				{ id: "1", name: "A", isHidden: false, lockedIn: false },
				{ id: "2", name: "B", isHidden: true, lockedIn: false },
				{ id: "3", name: "C", isHidden: false, lockedIn: true },
			];

			const siteStats = {
				totalUsers: "15",
				totalRatings: 100,
			};

			const stats = buildAdminStats(names, siteStats);

			expect(stats).toEqual({
				totalNames: 3,
				activeNames: 1,
				hiddenNames: 1,
				lockedInNames: 1,
				totalUsers: 15,
				recentVotes: 100,
			});
		});

		it("handles null siteStats safely", () => {
			const names: NameWithStats[] = [];
			const stats = buildAdminStats(names, null);

			expect(stats).toEqual({
				totalNames: 0,
				activeNames: 0,
				hiddenNames: 0,
				lockedInNames: 0,
				totalUsers: 0,
				recentVotes: 0,
			});
		});
	});

	describe("filterNamesByStatusAndSearch", () => {
		const names: NameWithStats[] = [
			{ id: "1", name: "Oliver", isHidden: false, lockedIn: false },
			{ id: "2", name: "Emma", isHidden: true, lockedIn: false },
			{ id: "3", name: "Liam", isHidden: false, lockedIn: true },
		];

		it("filters by 'all' status and no search term", () => {
			const filtered = filterNamesByStatusAndSearch(names, "all", "");
			expect(filtered.length).toBe(3);
		});

		it("filters by 'active' status", () => {
			const filtered = filterNamesByStatusAndSearch(names, "active", "");
			expect(filtered.length).toBe(1);
			expect(filtered[0].name).toBe("Oliver");
		});

		it("filters by 'hidden' status", () => {
			const filtered = filterNamesByStatusAndSearch(names, "hidden", "");
			expect(filtered.length).toBe(1);
			expect(filtered[0].name).toBe("Emma");
		});

		it("filters by 'locked' status", () => {
			const filtered = filterNamesByStatusAndSearch(names, "locked", "");
			expect(filtered.length).toBe(1);
			expect(filtered[0].name).toBe("Liam");
		});

		it("filters by search term (case-insensitive)", () => {
			const filtered = filterNamesByStatusAndSearch(names, "all", "EMM");
			expect(filtered.length).toBe(1);
			expect(filtered[0].name).toBe("Emma");
		});

		it("combines status filter and search term", () => {
			// Emma is hidden, Oliver is active. Search for 'e'
			const filteredActive = filterNamesByStatusAndSearch(names, "active", "e");
			expect(filteredActive.length).toBe(1); // Oliver
			expect(filteredActive[0].name).toBe("Oliver");

			const filteredHidden = filterNamesByStatusAndSearch(names, "hidden", "e");
			expect(filteredHidden.length).toBe(1); // Emma
			expect(filteredHidden[0].name).toBe("Emma");
		});
	});
});
