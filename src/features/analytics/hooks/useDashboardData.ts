import { useCallback, useEffect, useState } from "react";
import {
	type EngagementMetrics,
	type LeaderboardItem,
	leaderboardAPI,
	type SiteStats,
	statsAPI,
	type UserStats,
} from "@/features/analytics/services/analyticsService";
import { hiddenNamesAPI } from "@/shared/services/supabase/api";

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
	const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
	const [siteStats, setSiteStats] = useState<SiteStats | null>(null);
	const [userStats, setUserStats] = useState<UserStats | null>(null);
	const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true);
	const [hiddenNames, setHiddenNames] = useState<HiddenNameListItem[]>([]);
	const [showHiddenNames, setShowHiddenNames] = useState(false);
	const [engagementMetrics, setEngagementMetrics] = useState<EngagementMetrics | null>(null);
	const [isLoadingEngagement, setIsLoadingEngagement] = useState(true);
	const [timeframe, setTimeframe] = useState<DashboardTimeframe>("week");

	useEffect(() => {
		let isActive = true;

		const fetchLeaderboard = async () => {
			setIsLoadingLeaderboard(true);
			try {
				const data = await leaderboardAPI.getLeaderboard(10);
				if (isActive) {
					setLeaderboard(data);
				}
			} catch (error) {
				console.error("Failed to fetch leaderboard:", error);
			} finally {
				if (isActive) {
					setIsLoadingLeaderboard(false);
				}
			}
		};

		void fetchLeaderboard();

		return () => {
			isActive = false;
		};
	}, []);

	const refreshEngagementMetrics = useCallback(async () => {
		setIsLoadingEngagement(true);
		try {
			const metrics = await statsAPI.getEngagementMetrics(timeframe);
			setEngagementMetrics(metrics);
		} catch (error) {
			console.error("Failed to fetch engagement metrics:", error);
		} finally {
			setIsLoadingEngagement(false);
		}
	}, [timeframe]);

	useEffect(() => {
		void refreshEngagementMetrics();
	}, [refreshEngagementMetrics]);

	useEffect(() => {
		let isActive = true;

		const fetchStats = async () => {
			try {
				const [site, user] = await Promise.all([
					statsAPI.getSiteStats(),
					normalizedUserName ? statsAPI.getUserStats(normalizedUserName) : Promise.resolve(null),
				]);
				if (!isActive) {
					return;
				}
				setSiteStats(site);
				setUserStats(user);
			} catch (error) {
				console.error("Failed to fetch stats:", error);
			}
		};

		void fetchStats();

		return () => {
			isActive = false;
		};
	}, [normalizedUserName]);

	useEffect(() => {
		if (!isAdmin || !showHiddenNames) {
			return;
		}

		let isActive = true;

		const fetchHiddenNames = async () => {
			try {
				const data = await hiddenNamesAPI.getHiddenNames();
				if (isActive) {
					setHiddenNames(data);
				}
			} catch (error) {
				console.error("Failed to fetch hidden names:", error);
			}
		};

		void fetchHiddenNames();

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
				const result = await hiddenNamesAPI.unhideName(normalizedUserName, nameId);
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
