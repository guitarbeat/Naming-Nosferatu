import { describe, expect, it } from "vitest";
import type { NameWithStats, SiteStatsLike } from "./types";
import { buildAdminStats } from "./utils";

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
			{ id: "2", name: "Active2", isHidden: false }, // implicitly not locked
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
			activeNames: 2, // Active1, Active2
			hiddenNames: 2, // Hidden1, HiddenAndLocked
			lockedInNames: 2, // Locked1, HiddenAndLocked
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
