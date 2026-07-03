import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
