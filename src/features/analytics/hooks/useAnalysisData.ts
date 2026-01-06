import { useQuery } from "@tanstack/react-query";
import { catNamesAPI } from "../../../shared/services/supabase/client";

interface UseAnalysisDataProps {
	userName?: string | null;
	isAdmin?: boolean;
	userFilter?: string;
	dateFilter?: string;
	rankingPeriods?: number;
	enabled?: boolean;
}

export function useAnalysisData({
	userName,
	isAdmin,
	userFilter = "all",
	dateFilter = "all",
	rankingPeriods = 7,
	enabled = true,
}: UseAnalysisDataProps) {
	// 1. Leaderboard Data
	const leaderboardQuery = useQuery({
		queryKey: ["leaderboard"],
		queryFn: () => catNamesAPI.getLeaderboard(null),
		enabled,
		staleTime: 1000 * 60 * 5, // 5 minutes
	});

	// 2. Selection Popularity
	const popularityQuery = useQuery({
		queryKey: ["selectionPopularity"],
		queryFn: () => catNamesAPI.getSelectionPopularity(null),
		enabled,
		staleTime: 1000 * 60 * 5,
	});

	// 3. Popularity Analytics (Admin only)
	const analyticsQuery = useQuery({
		queryKey: ["popularityAnalytics", userFilter, userName],
		queryFn: () =>
			catNamesAPI.getPopularityAnalytics(null, userFilter, userName),
		enabled: enabled && isAdmin,
		staleTime: 1000 * 60 * 5,
	});

	// 4. Ranking History
	const rankingHistoryQuery = useQuery({
		queryKey: ["rankingHistory", rankingPeriods, dateFilter],
		queryFn: () =>
			catNamesAPI.getRankingHistory(10, rankingPeriods, {
				dateFilter,
			}),
		enabled,
		staleTime: 1000 * 60 * 15, // 15 minutes
	});

	// 5. Site Stats (Admin only)
	const siteStatsQuery = useQuery({
		queryKey: ["siteStats"],
		queryFn: () => catNamesAPI.getSiteStats(),
		enabled: enabled && isAdmin,
		staleTime: 1000 * 60 * 60, // 1 hour
	});

	return {
		leaderboardData: leaderboardQuery.data,
		selectionPopularity: popularityQuery.data,
		analyticsData: analyticsQuery.data,
		rankingHistory: rankingHistoryQuery.data,
		siteStats: siteStatsQuery.data,
		isLoading:
			leaderboardQuery.isLoading ||
			popularityQuery.isLoading ||
			(isAdmin && analyticsQuery.isLoading) ||
			rankingHistoryQuery.isLoading ||
			(isAdmin && siteStatsQuery.isLoading),
		error:
			leaderboardQuery.error ||
			popularityQuery.error ||
			analyticsQuery.error ||
			rankingHistoryQuery.error ||
			siteStatsQuery.error,
		refetch: () => {
			leaderboardQuery.refetch();
			popularityQuery.refetch();
			if (isAdmin) {
				analyticsQuery.refetch();
				siteStatsQuery.refetch();
			}
			rankingHistoryQuery.refetch();
		},
	};
}
