/**
 * @module AnalysisDashboard
 * @description Shows top performing names to help users choose a name for their cat.
 * Displays a consolidated table with Rating, Wins, and Selected counts.
 * Includes a bump chart visualization showing ranking changes over time.
 */

import { useQuery } from "@tanstack/react-query";
import PropTypes from "prop-types";
import { useCallback, useMemo, useState } from "react";
import { STORAGE_KEYS } from "../../../core/constants";
import { useCollapsible } from "../../../core/hooks/useStorage";
import { nameItemShape } from "../../propTypes";
import { catNamesAPI, hiddenNamesAPI } from "../../services/supabase/client";
import {
	calculatePercentile,
	clearAllCaches,
	devError,
} from "../../utils/core";
import { BumpChart } from "../Charts/Charts";
import {
	CollapsibleContent,
	CollapsibleHeader,
} from "../Header/CollapsibleHeader";
import { useNameManagementContextSafe } from "../NameManagementView/nameManagementCore";
import { TournamentToolbar } from "../TournamentToolbar/TournamentToolbar";
import { AnalysisInsights, AnalysisPanel, AnalysisTable } from "./AnalysisUI";
import styles from "./AnalysisUI.module.css";
import type {
	AnalyticsDataItem,
	HighlightItem,
	LeaderboardItem,
	SelectionPopularityItem,
} from "./types";

/**
 * Analysis Dashboard Component
 * Shows top performing names to help users choose a name for their cat
 */
interface AnalysisDashboardProps {
	highlights?: { topRated?: HighlightItem[]; mostWins?: HighlightItem[] };
	userName?: string | null;
	showGlobalLeaderboard?: boolean;
	defaultCollapsed?: boolean;
	isAdmin?: boolean;
	onNameHidden?: (id: string) => void;
}

export function AnalysisDashboard({
	highlights,
	userName,
	showGlobalLeaderboard = true,
	defaultCollapsed = false,
	isAdmin = false,
	onNameHidden,
}: AnalysisDashboardProps) {
	const [viewMode, setViewMode] = useState("chart"); // "chart" | "table" | "insights"
	const [sortField, setSortField] = useState("rating");
	const [sortDirection, setSortDirection] = useState("desc");

	// Collapsed state with localStorage persistence
	const { isCollapsed, toggleCollapsed } = useCollapsible(
		STORAGE_KEYS.ANALYSIS_DASHBOARD_COLLAPSED,
		defaultCollapsed,
	);

	// Get context for filtering
	const toolbarContext = useNameManagementContextSafe() as any;
	const filterConfig = toolbarContext?.filterConfig;
	const userFilter = filterConfig?.userFilter || "all";
	const dateFilter = filterConfig?.dateFilter || "all";

	const rankingPeriods = useMemo(() => {
		const map: Record<string, number> = {
			today: 2,
			week: 7,
			month: 30,
			year: 365,
			all: 7,
		};
		return Math.max(map[dateFilter] || 7, 2);
	}, [dateFilter]);

	// 1. Fetch Data
	const {
		leaderboardData,
		selectionPopularity,
		analyticsData,
		rankingHistory,
		siteStats,
		isLoading,
		error,
		refetch,
	} = useAnalysisData({
		userName,
		isAdmin,
		userFilter,
		dateFilter,
		rankingPeriods,
		enabled: showGlobalLeaderboard,
	});

	// 2. Process Data
	const { displayNames, summaryStats, namesWithInsights, generalInsights } =
		useAnalysisDisplayData({
			leaderboardData: (leaderboardData ?? null) as LeaderboardItem[] | null,
			selectionPopularity: selectionPopularity ?? null,
			analyticsData: (analyticsData ?? null) as AnalyticsDataItem[] | null,
			isAdmin,
			highlights,
			filterConfig,
			sortField,
			sortDirection,
		});

	const handleSort = useCallback(
		(field: string) => {
			if (sortField === field) {
				setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"));
			} else {
				setSortField(field);
				setSortDirection("desc");
			}
		},
		[sortField],
	);

	const handleHideName = useCallback(
		async (nameId: string | number, _name: string) => {
			if (!isAdmin || !userName) return;
			try {
				await hiddenNamesAPI.hideName(userName, String(nameId));
				clearAllCaches();
				if (onNameHidden) onNameHidden(String(nameId));
				refetch();
			} catch (error) {
				devError("[AnalysisDashboard] Error hiding name:", error);
			}
		},
		[isAdmin, userName, onNameHidden, refetch],
	);

	const filteredRankingData = useMemo(() => {
		if (!rankingHistory?.data?.length) return [];
		const allowedIds = new Set(displayNames.map((n) => n.id));
		if (allowedIds.size === 0) return rankingHistory.data;
		return rankingHistory.data.filter((entry: any) => allowedIds.has(entry.id));
	}, [rankingHistory?.data, displayNames]);

	if (!showGlobalLeaderboard && !highlights) return null;

	const toolbar = toolbarContext?.analysisMode ? (
		<TournamentToolbar
			mode="hybrid"
			filters={toolbarContext.filterConfig}
			onFilterChange={
				toolbarContext.handleFilterChange ||
				((name: string, value: string) => {
					if (name === "searchTerm" && toolbarContext.setSearchTerm)
						toolbarContext.setSearchTerm(value);
					if (name === "category" && toolbarContext.setSelectedCategory)
						toolbarContext.setSelectedCategory(value || null);
					if (name === "sortBy" && toolbarContext.setSortBy)
						toolbarContext.setSortBy(value || "alphabetical");
					if (name === "filterStatus" && toolbarContext.setFilterStatus)
						toolbarContext.setFilterStatus(value);
					if (name === "userFilter" && toolbarContext.setUserFilter)
						toolbarContext.setUserFilter(value);
					if (name === "selectionFilter" && toolbarContext.setSelectionFilter)
						toolbarContext.setSelectionFilter(value);
					if (name === "dateFilter" && toolbarContext.setDateFilter)
						toolbarContext.setDateFilter(value);
					if (name === "sortOrder" && toolbarContext.setSortOrder)
						toolbarContext.setSortOrder(value);
				})
			}
			categories={toolbarContext.categories || []}
			showUserFilter={toolbarContext.profileProps?.showUserFilter || false}
			showSelectionFilter={!!toolbarContext.profileProps?.selectionStats}
			userOptions={toolbarContext.profileProps?.userOptions || []}
			filteredCount={displayNames.length}
			totalCount={displayNames.length} // Simplified for now
			analysisMode={true}
		/>
	) : null;

	return (
		<AnalysisPanel showHeader={false}>
			<CollapsibleHeader
				title={isAdmin ? "All Names" : "Top Names"}
				icon={isAdmin ? "📈" : "📊"}
				isCollapsed={isCollapsed}
				onToggle={toggleCollapsed}
				contentId="analysis-dashboard-content"
				toolbar={toolbar}
			/>

			<CollapsibleContent
				id="analysis-dashboard-content"
				isCollapsed={isCollapsed}
			>
				{isLoading ? (
					<div className={styles.loading} role="status">
						Loading top names...
					</div>
				) : error ? (
					<div className={styles.error} role="alert">
						Failed to load top names.
					</div>
				) : displayNames.length === 0 ? (
					<div className={styles.empty}>No names available yet.</div>
				) : (
					<>
						<div className={styles.viewToggle}>
							{["chart", "table", "insights"].map((mode) => (
								<button
									key={mode}
									type="button"
									className={`${styles.viewBtn} ${viewMode === mode ? styles.active : ""}`}
									onClick={() => setViewMode(mode)}
									aria-pressed={viewMode === mode}
								>
									{mode === "chart"
										? "📊 Bump Chart"
										: mode === "table"
											? "📋 Table"
											: "💡 Insights"}
								</button>
							))}
						</div>

						{viewMode === "chart" && rankingHistory && (
							<div className={styles.chartContainer}>
								<BumpChart
									data={filteredRankingData}
									labels={rankingHistory.timeLabels}
									timeLabels={rankingHistory.timeLabels}
									title=""
									height={320}
									showLegend={true}
								/>
							</div>
						)}

						{viewMode === "table" && (
							<AnalysisTable
								names={namesWithInsights}
								isAdmin={isAdmin}
								canHideNames={isAdmin && !!onNameHidden}
								sortField={sortField}
								sortDirection={sortDirection}
								onSort={handleSort}
								onHideName={handleHideName}
								summaryStats={summaryStats}
							/>
						)}

						{viewMode === "insights" && (
							<AnalysisInsights
								namesWithInsights={namesWithInsights}
								summaryStats={isAdmin ? (siteStats ?? null) : summaryStats}
								generalInsights={generalInsights}
								isAdmin={isAdmin}
								canHideNames={isAdmin && !!onNameHidden}
								onHideName={handleHideName}
							/>
						)}
					</>
				)}
			</CollapsibleContent>
		</AnalysisPanel>
	);
}

AnalysisDashboard.propTypes = {
	isAdmin: PropTypes.bool,
	userName: PropTypes.string,
	onNameHidden: PropTypes.func,
	highlights: PropTypes.shape({
		topRated: PropTypes.arrayOf(nameItemShape),
		mostWins: PropTypes.arrayOf(nameItemShape),
	}),
	showGlobalLeaderboard: PropTypes.bool,
	defaultCollapsed: PropTypes.bool,
};

// useAnalysisData hook - uses imports from top of file

export function useAnalysisData({
	userName,
	isAdmin,
	userFilter = "all",
	dateFilter = "all",
	rankingPeriods = 7,
	enabled = true,
}: {
	userName?: string | null;
	isAdmin?: boolean;
	userFilter?: string;
	dateFilter?: string;
	rankingPeriods?: number;
	enabled?: boolean;
}) {
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

// useAnalysisDisplayData hook - uses imports from top of file

export interface ConsolidatedName {
	id: string | number;
	name: string;
	rating: number;
	wins: number;
	selected: number;
	dateSubmitted: string | null;
	insights?: string[];
	ratingPercentile?: number;
	selectedPercentile?: number;
	[key: string]: unknown;
}

interface UseAnalysisDisplayDataProps {
	leaderboardData: LeaderboardItem[] | null;
	selectionPopularity: SelectionPopularityItem[] | null;
	analyticsData: AnalyticsDataItem[] | null;
	isAdmin: boolean;
	highlights?: { topRated?: HighlightItem[]; mostWins?: HighlightItem[] };
	filterConfig?: {
		selectionFilter?: string;
		dateFilter?: string;
		[key: string]: unknown;
	};
	sortField: string;
	sortDirection: string;
}

export function useAnalysisDisplayData({
	leaderboardData,
	selectionPopularity,
	analyticsData,
	isAdmin,
	highlights,
	filterConfig,
	sortField,
	sortDirection,
}: UseAnalysisDisplayDataProps) {
	// 1. Consolidate raw data from multiple sources
	const consolidatedNames = useMemo(() => {
		if (isAdmin && analyticsData?.length) {
			return analyticsData.map((item) => ({
				id: item.name_id,
				name: item.name,
				rating: item.avg_rating || 1500,
				wins: item.total_wins || 0,
				selected: item.times_selected || 0,
				dateSubmitted: item.created_at || item.date_submitted || null,
			}));
		}

		const nameMap = new Map<string, ConsolidatedName>();

		if (leaderboardData?.length) {
			leaderboardData.forEach((item) => {
				if ((item.avg_rating || 0) > 1500 || (item.wins ?? 0) > 0) {
					nameMap.set(String(item.name_id), {
						id: item.name_id,
						name: item.name,
						rating: item.avg_rating || 1500,
						wins: item.wins ?? 0,
						selected: 0,
						dateSubmitted: item.created_at || item.date_submitted || null,
					});
				}
			});
		}

		if (selectionPopularity?.length) {
			selectionPopularity.forEach((item) => {
				const existing = nameMap.get(String(item.name_id));
				if (existing) {
					existing.selected = item.times_selected || 0;
				} else {
					nameMap.set(String(item.name_id), {
						id: String(item.name_id),
						name: item.name,
						rating: 1500,
						wins: 0,
						selected: item.times_selected || 0,
						dateSubmitted: item.created_at || item.date_submitted || null,
					});
				}
			});
		}

		return Array.from(nameMap.values()).sort((a, b) => {
			if (b.rating !== a.rating) return b.rating - a.rating;
			return b.wins - a.wins;
		});
	}, [leaderboardData, selectionPopularity, analyticsData, isAdmin]);

	// 2. Filter and Sort
	const displayNames = useMemo((): ConsolidatedName[] => {
		let names: ConsolidatedName[] = [];

		if (isAdmin && consolidatedNames.length > 0) {
			names = [...consolidatedNames];
		} else if (highlights?.topRated?.length) {
			const highlightMap = new Map<string, ConsolidatedName>();
			highlights.topRated.forEach((item) => {
				highlightMap.set(item.id, {
					id: item.id,
					name: item.name,
					rating: item.avg_rating || item.value || 1500,
					wins: 0,
					selected: 0,
					dateSubmitted: null,
				});
			});
			if (highlights.mostWins?.length) {
				highlights.mostWins.forEach((item) => {
					const existing = highlightMap.get(item.id);
					if (existing) {
						existing.wins = item.value || 0;
					}
				});
			}
			names = Array.from(highlightMap.values());
		} else {
			names = consolidatedNames;
		}

		// Apply filters
		if (filterConfig) {
			if (
				filterConfig.selectionFilter &&
				filterConfig.selectionFilter !== "all"
			) {
				if (filterConfig.selectionFilter === "selected") {
					names = names.filter((n) => n.selected > 0);
				} else if (filterConfig.selectionFilter === "never_selected") {
					names = names.filter((n) => n.selected === 0);
				}
			}

			if (filterConfig.dateFilter && filterConfig.dateFilter !== "all") {
				const now = new Date();
				let filterDate = new Date(0);

				switch (filterConfig.dateFilter) {
					case "today":
						filterDate = new Date(
							now.getFullYear(),
							now.getMonth(),
							now.getDate(),
						);
						break;
					case "week":
						filterDate = new Date(now);
						filterDate.setDate(now.getDate() - 7);
						break;
					case "month":
						filterDate = new Date(now.getFullYear(), now.getMonth(), 1);
						break;
					case "year":
						filterDate = new Date(now.getFullYear(), 0, 1);
						break;
				}

				names = names.filter((n) => {
					if (!n.dateSubmitted) return false;
					const submittedDate = new Date(n.dateSubmitted as string);
					return submittedDate >= filterDate;
				});
			}
		}

		// Apply sorting
		if (sortField) {
			names.sort((a, b) => {
				let aVal = a[sortField as keyof ConsolidatedName] as
					| string
					| number
					| null
					| undefined;
				let bVal = b[sortField as keyof ConsolidatedName] as
					| string
					| number
					| null
					| undefined;

				if (sortField === "dateSubmitted") {
					aVal = aVal ? new Date(aVal as string).getTime() : 0;
					bVal = bVal ? new Date(bVal as string).getTime() : 0;
				}

				if (typeof aVal === "string" && typeof bVal === "string") {
					return sortDirection === "desc"
						? bVal.localeCompare(aVal)
						: aVal.localeCompare(bVal);
				}

				const aNum = Number(aVal) || 0;
				const bNum = Number(bVal) || 0;
				return sortDirection === "desc" ? bNum - aNum : aNum - bNum;
			});
		}

		return names;
	}, [
		highlights,
		consolidatedNames,
		isAdmin,
		sortField,
		sortDirection,
		filterConfig,
	]);

	// 3. Summary Stats
	const summaryStats = useMemo(() => {
		if (displayNames.length === 0) return null;

		const maxRating = Math.max(...displayNames.map((n) => n.rating));
		const maxWins = Math.max(...displayNames.map((n) => n.wins));
		const maxSelected = Math.max(...displayNames.map((n) => n.selected));
		const avgRating =
			displayNames.reduce((sum, n) => sum + n.rating, 0) / displayNames.length;
		const avgWins =
			displayNames.reduce((sum, n) => sum + n.wins, 0) / displayNames.length;
		const totalSelected = displayNames.reduce((sum, n) => sum + n.selected, 0);

		return {
			maxRating,
			maxWins,
			maxSelected,
			avgRating: Math.round(avgRating),
			avgWins: Math.round(avgWins * 10) / 10,
			totalSelected,
			topName: displayNames[0],
		};
	}, [displayNames]);

	// 4. Insights & Percentiles
	const namesWithInsights = useMemo(() => {
		if (displayNames.length === 0) return [];

		const ratings = displayNames.map((n) => n.rating);
		const selectedCounts = displayNames.map((n) => n.selected);

		return displayNames.map((item) => {
			const ratingPercentile = calculatePercentile(item.rating, ratings, true);
			const selectedPercentile = calculatePercentile(
				item.selected,
				selectedCounts,
				true,
			);

			const insights: string[] = [];
			if (ratingPercentile <= 10) insights.push("worst_rated");
			if (selectedPercentile <= 10 && item.selected === 0)
				insights.push("never_selected");
			if (item.selected === 0 && item.wins === 0 && item.rating <= 1500)
				insights.push("inactive");
			if (ratingPercentile <= 20 && selectedPercentile <= 20)
				insights.push("poor_performer");
			if (ratingPercentile >= 90) insights.push("top_rated");
			if (selectedPercentile >= 90) insights.push("most_selected");
			if (ratingPercentile >= 70 && selectedPercentile < 50)
				insights.push("underrated");
			if (
				item.wins > 0 &&
				!displayNames.find((n) => n.id !== item.id && n.wins > 0)
			) {
				insights.push("undefeated");
			}

			return {
				...item,
				ratingPercentile,
				selectedPercentile,
				insights,
			};
		});
	}, [displayNames]);

	const generalInsights = useMemo(() => {
		if (!summaryStats || displayNames.length === 0) return [];

		const result: Array<{ type: string; message: string; icon: string }> = [];

		const [worstRated] = [...displayNames].sort((a, b) => a.rating - b.rating);
		if (worstRated && worstRated.rating < 1500) {
			result.push({
				type: "warning",
				message: `${worstRated.name} has the lowest rating(${worstRated.rating}) - consider hiding`,
				icon: "⚠️",
			});
		}

		const neverSelectedCount = displayNames.filter(
			(n) => n.selected === 0,
		).length;
		if (neverSelectedCount > 0) {
			result.push({
				type: "warning",
				message: `${neverSelectedCount} names never selected - consider hiding inactive ones`,
				icon: "🗑️",
			});
		}

		if (summaryStats.topName) {
			result.push({
				type: "info",
				message: `${summaryStats.topName.name} leads with a rating of ${summaryStats.topName.rating} `,
				icon: "🏆",
			});
		}

		return result;
	}, [summaryStats, displayNames]);

	return {
		displayNames,
		summaryStats,
		namesWithInsights,
		generalInsights,
	};
}
