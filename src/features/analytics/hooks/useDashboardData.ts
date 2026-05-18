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

	const { data: leaderboard, isLoading: isLoadingLeaderboard } = useAsyncData<LeaderboardItem[]>(
		() => leaderboardAPI.getLeaderboard(10),
		[],
	);

	const {
		data: engagementMetrics,
		isLoading: isLoadingEngagement,
		refresh: refreshEngagementMetrics,
	} = useAsyncData<EngagementMetrics | null>(
		() => statsAPI.getEngagementMetrics(timeframe as "day" | "week" | "month" | "year"),
		null,
		{ deps: [timeframe] },
	);

	const { data: siteStats } = useAsyncData<SiteStats | null>(() => statsAPI.getSiteStats(), null);

	const { data: userStats } = useAsyncData<UserStats | null>(
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
			.catch(() => {
				/* Errors are handled contextually */
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
			const result = await unhideName(normalizedUserName, String(nameId)).catch(() => ({
				success: false,
			}));
			if (result.success) {
				setHiddenNames((current) => current.filter((name) => name.id !== nameId));
			}
		},
		[normalizedUserName],
	);

	return {
		engagementMetrics,
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
