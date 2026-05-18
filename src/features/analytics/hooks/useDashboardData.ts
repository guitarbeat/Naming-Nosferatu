import { useCallback, useEffect, useState } from "react";
import { fetchHiddenNames, unhideName } from "@/features/names/api";
import { useAsyncData } from "@/shared/hooks/useAsyncData";
import {
	type EngagementMetrics,
	type LeaderboardItem,
	leaderboardAPI,
	type SiteStats,
	statsAPI,
	type UserStats,
} from "@/shared/services/supabase/statsService";

export type DashboardTimeframe = "day" | "week" | "month";

export interface HiddenNameListItem {
	id: string | number;
	name: string;
}

interface UseDashboardDataParams {
	isAdmin?: boolean;
	userName?: string;
}

export function useDashboardData({ isAdmin = false, userName = "" }: UseDashboardDataParams) {
	const normalizedUserName = userName.trim();

	const [timeframe, setTimeframe] = useState<DashboardTimeframe>("week");
	const [showHiddenNames, setShowHiddenNames] = useState(false);
	const [hiddenNames, setHiddenNames] = useState<HiddenNameListItem[]>([]);

	const {
		data: leaderboard,
		isLoading: isLoadingLeaderboard,
		error: errorLeaderboard,
	} = useAsyncData<LeaderboardItem[]>(() => leaderboardAPI.getLeaderboard(10), []);

	const {
		data: engagementMetrics,
		isLoading: isLoadingEngagement,
		error: errorEngagement,
		refresh: refreshEngagementMetrics,
	} = useAsyncData<EngagementMetrics | null>(
		() => statsAPI.getEngagementMetrics(timeframe as "day" | "week" | "month" | "year"),
		null,
		{ deps: [timeframe] },
	);

	const { data: siteStats, error: errorSiteStats } = useAsyncData<SiteStats | null>(
		() => statsAPI.getSiteStats(),
		null,
	);

	const { data: userStats, error: errorUserStats } = useAsyncData<UserStats | null>(
		() => (normalizedUserName ? statsAPI.getUserStats(normalizedUserName) : Promise.resolve(null)),
		null,
		{ deps: [normalizedUserName] },
	);

	useEffect(() => {
		if (!isAdmin || !showHiddenNames) {
			return;
		}

		let isActive = true;
		fetchHiddenNames()
			.then((result) => {
				if (isActive) {
					setHiddenNames(result.names);
				}
			})
			.catch((error) => {
				console.error("Failed to fetch hidden names:", error);
			});

		return () => {
			isActive = false;
		};
	}, [isAdmin, showHiddenNames]);

	const toggleHiddenNames = useCallback(() => {
		setShowHiddenNames((current) => !current);
	}, []);

	const handleUnhideName = useCallback(
		async (nameId: string | number) => {
			if (!normalizedUserName) {
				return;
			}
			try {
				const result = await unhideName(normalizedUserName, String(nameId));
				if (!result.success) {
					throw new Error(result.error || "Failed to unhide name");
				}
				setHiddenNames((current) => current.filter((name) => name.id !== nameId));
			} catch (error) {
				console.error("Failed to unhide name:", error);
			}
		},
		[normalizedUserName],
	);

	return {
		engagementMetrics,
		errorEngagement,
		errorLeaderboard,
		errorSiteStats,
		errorUserStats,
		handleUnhideName,
		hiddenNames,
		isLoadingEngagement,
		isLoadingLeaderboard,
		leaderboard,
		refreshEngagementMetrics,
		setTimeframe,
		showHiddenNames,
		siteStats,
		timeframe,
		toggleHiddenNames,
		userStats,
	};
}
