import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchHiddenNames, unhideName } from "@/features/names/api";
import { leaderboardAPI, statsAPI } from "@/shared/services/supabase/statsService";
import { useDashboardData } from "./useDashboardData";

vi.mock("@/shared/services/supabase/statsService", () => ({
	leaderboardAPI: {
		getLeaderboard: vi.fn(),
	},
	statsAPI: {
		getEngagementMetrics: vi.fn(),
		getSiteStats: vi.fn(),
		getUserStats: vi.fn(),
	},
}));

vi.mock("@/features/names/api", () => ({
	fetchHiddenNames: vi.fn(),
	unhideName: vi.fn(),
}));

describe("useDashboardData", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		vi.mocked(leaderboardAPI.getLeaderboard).mockResolvedValue([
			{
				name_id: "name-1",
				name: "Nova",
				avg_rating: 1660,
				wins: 8,
				total_ratings: 12,
			},
		]);
		vi.mocked(statsAPI.getSiteStats).mockResolvedValue({
			totalNames: 20,
			activeNames: 18,
			hiddenNames: 2,
			totalUsers: 7,
			totalRatings: 44,
			totalSelections: 12,
			avgRating: 1542,
		});
		vi.mocked(statsAPI.getUserStats).mockResolvedValue({
			totalRatings: 5,
			totalSelections: 3,
			totalWins: 2,
			winRate: 67,
		});
		vi.mocked(statsAPI.getEngagementMetrics).mockResolvedValue({
			totalTournaments: 4,
			completedTournaments: 3,
			averageTournamentTime: 12,
			totalMatches: 25,
			peakActiveUsers: 6,
			dailyActiveUsers: 4,
			weeklyActiveUsers: 7,
			monthlyActiveUsers: 9,
			mostActiveHour: "12:00",
			mostActiveDay: "Monday",
			userRetentionRate: 58,
			averageSessionDuration: 10,
			totalPageViews: 99,
			bounceRate: 24,
		});
		vi.mocked(fetchHiddenNames).mockResolvedValue({
			names: [{ id: "hidden-1", name: "Ghost" }],
			source: "supabase",
		});
		vi.mocked(unhideName).mockResolvedValue({
			success: true,
			error: undefined,
		});
	});

	it("loads leaderboard, stats, and engagement data on mount", async () => {
		const { result } = renderHook(() =>
			useDashboardData({
				isAdmin: true,
				userName: "  Ada  ",
			}),
		);

		await waitFor(() => {
			expect(result.current.isLoadingLeaderboard).toBe(false);
			expect(result.current.isLoadingEngagement).toBe(false);
		});

		expect(leaderboardAPI.getLeaderboard).toHaveBeenCalledWith(10);
		expect(statsAPI.getSiteStats).toHaveBeenCalledTimes(1);
		expect(statsAPI.getUserStats).toHaveBeenCalledWith("Ada");
		expect(statsAPI.getEngagementMetrics).toHaveBeenCalledWith("week");
		expect(result.current.leaderboard[0]?.name).toBe("Nova");
		expect(result.current.siteStats?.totalNames).toBe(20);
		expect(result.current.userStats?.totalWins).toBe(2);
		expect(result.current.engagementMetrics?.completedTournaments).toBe(3);
	});

	it("loads hidden names on demand and removes names after unhiding", async () => {
		const { result } = renderHook(() =>
			useDashboardData({
				isAdmin: true,
				userName: "  Ada  ",
			}),
		);

		await act(async () => {
			result.current.toggleHiddenNames();
		});

		await waitFor(() => {
			expect(fetchHiddenNames).toHaveBeenCalledTimes(1);
		});
		expect(result.current.hiddenNames).toEqual([{ id: "hidden-1", name: "Ghost" }]);

		await act(async () => {
			await result.current.handleUnhideName("hidden-1");
		});

		expect(unhideName).toHaveBeenCalledWith("Ada", "hidden-1");
		expect(result.current.hiddenNames).toEqual([]);
	});

	it("skips user stats when no user name is provided", async () => {
		renderHook(() =>
			useDashboardData({
				isAdmin: false,
				userName: "",
			}),
		);

		await waitFor(() => {
			expect(statsAPI.getSiteStats).toHaveBeenCalledTimes(1);
		});

		expect(statsAPI.getUserStats).not.toHaveBeenCalled();
	});
});
