import { useState } from "react";
import {
	type EngagementMetrics,
	type LeaderboardItem,
	leaderboardAPI,
	type SiteStats,
	statsAPI,
	type UserStats,
} from "@/shared/api/mock/statsService";
import { useAsyncData } from "@/shared/hooks";

export type DashboardTimeframe = "day" | "week" | "month";

interface UseDashboardDataParams {
	userName?: string;
}

export function useDashboardData({ userName = "" }: UseDashboardDataParams) {
	const normalizedUserName = userName.trim();

	const [timeframe, setTimeframe] = useState<DashboardTimeframe>("week");

	const {
		data: leaderboard,
		isLoading: isLoadingLeaderboard,
		error: errorLeaderboard,
		refresh: refreshLeaderboard,
	} = useAsyncData<LeaderboardItem[]>(() => leaderboardAPI.getLeaderboard(10), []);

	const {
		data: engagementMetrics,
		isLoading: isLoadingEngagement,
		error: errorEngagement,
		refresh: refreshEngagementMetrics,
	} = useAsyncData<EngagementMetrics | null>(() => statsAPI.getEngagementMetrics(timeframe), null, {
		deps: [timeframe],
	});

	const { data: siteStats, error: errorSiteStats } = useAsyncData<SiteStats | null>(
		() => statsAPI.getSiteStats(),
		null,
	);

	const { data: userStats, error: errorUserStats } = useAsyncData<UserStats | null>(
		() => (normalizedUserName ? statsAPI.getUserStats(normalizedUserName) : Promise.resolve(null)),
		null,
		{ deps: [normalizedUserName] },
	);

	return {
		engagementMetrics,
		errorEngagement,
		errorLeaderboard,
		errorSiteStats,
		errorUserStats,
		isLoadingEngagement,
		isLoadingLeaderboard,
		leaderboard,
		refreshEngagementMetrics,
		refreshLeaderboard,
		setTimeframe,
		siteStats,
		timeframe,
		userStats,
	};
}
