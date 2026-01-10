/**
 * @module AnalysisDashboard
 * @description Shows top performing names to help users choose a name for their cat.
 * Displays a consolidated table with Rating, Wins, and Selected counts.
 * Includes a bump chart visualization showing ranking changes over time.
 */

import { useCallback, useMemo, useState } from "react";
import { STORAGE_KEYS } from "../../../core/constants";
import { useCollapsible } from "../../../core/hooks/useStorage";
import { BumpChart } from "../../../shared/components/Charts";
import {
	CollapsibleContent,
	CollapsibleHeader,
} from "../../../shared/components/CollapsibleHeader";
import { useNameManagementContextOptional } from "../../../shared/components/NameManagementView/nameManagementCore";
import { TournamentToolbar } from "../../../shared/components/TournamentToolbar/TournamentToolbar"; // Corrected path assumption
import { hiddenNamesAPI } from "../../../shared/services/supabase/client";
import { clearAllCaches, devError } from "../../../shared/utils";
import { useAnalysisData } from "../hooks/useAnalysisData";
import { useAnalysisDisplayData } from "../hooks/useAnalysisDisplayData";
import type { AnalysisDashboardProps, AnalyticsDataItem, LeaderboardItem } from "../types";
import { AnalysisInsights } from "./AnalysisInsights";
import { AnalysisPanel } from "./AnalysisPanel";
import styles from "../analytics.module.css";
import { AnalysisTable } from "./AnalysisTable";

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

	// Get context for filtering (with fallback for standalone usage)
	const toolbarContext = useNameManagementContextOptional();
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
	const { displayNames, summaryStats, namesWithInsights, generalInsights } = useAnalysisDisplayData(
		{
			leaderboardData: (leaderboardData ?? null) as LeaderboardItem[] | null,
			selectionPopularity: selectionPopularity ?? null,
			analyticsData: (analyticsData ?? null) as AnalyticsDataItem[] | null,
			isAdmin,
			highlights,
			filterConfig: filterConfig as {
				selectionFilter?: string;
				dateFilter?: string;
				[key: string]: unknown;
			},
			sortField,
			sortDirection,
		},
	);

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
			if (!isAdmin || !userName) {
				return;
			}
			try {
				await hiddenNamesAPI.hideName(userName, String(nameId));
				clearAllCaches();
				if (onNameHidden) {
					onNameHidden(String(nameId));
				}
				refetch();
			} catch (error) {
				devError("[AnalysisDashboard] Error hiding name:", error);
			}
		},
		[isAdmin, userName, onNameHidden, refetch],
	);

	const filteredRankingData = useMemo(() => {
		if (!rankingHistory?.data?.length) {
			return [];
		}
		const allowedIds = new Set(displayNames.map((n) => n.id));
		const filtered =
			allowedIds.size === 0
				? rankingHistory.data
				: rankingHistory.data.filter((entry) => allowedIds.has(entry.id));

		// Filter out null values from rankings to match BumpChart expectations
		return filtered.map((entry) => ({
			...entry,
			rankings: entry.rankings.filter((ranking): ranking is number => ranking != null),
		}));
	}, [rankingHistory?.data, displayNames]);

	if (!showGlobalLeaderboard && !highlights) {
		return null;
	}

	const toolbar = toolbarContext?.analysisMode ? (
		<TournamentToolbar
			mode="hybrid"
			filters={toolbarContext.filterConfig}
			onFilterChange={
				(toolbarContext.handleFilterChange as (name: string, value: string) => void) ||
				((name: string, value: string) => {
					if (name === "searchTerm" && toolbarContext?.setSearchQuery) {
						toolbarContext.setSearchQuery(value);
					}
					if (name === "category" && toolbarContext?.setSelectedCategory) {
						toolbarContext.setSelectedCategory(value || "");
					}
					if (name === "sortBy" && toolbarContext?.setSortBy) {
						toolbarContext.setSortBy(value || "alphabetical");
					}
					if (name === "filterStatus" && toolbarContext?.setFilterStatus) {
						toolbarContext.setFilterStatus(value);
					}
					if (name === "userFilter" && toolbarContext?.setUserFilter) {
						toolbarContext.setUserFilter(value as "all" | "user" | "other");
					}
					if (name === "selectionFilter" && toolbarContext?.setSelectionFilter) {
						toolbarContext.setSelectionFilter(value as "all" | "selected" | "unselected");
					}
					if (name === "dateFilter" && toolbarContext?.setDateFilter) {
						toolbarContext.setDateFilter(value as "all" | "today" | "week" | "month");
					}
					if (name === "sortOrder" && toolbarContext?.setSortOrder) {
						toolbarContext.setSortOrder(value as "asc" | "desc");
					}
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

			<CollapsibleContent id="analysis-dashboard-content" isCollapsed={isCollapsed}>
				{isLoading ? (
					<div className={panelStyles.loading} role="status">
						Loading top names...
					</div>
				) : error ? (
					<div className={panelStyles.error} role="alert">
						Unable to load names. Please try refreshing the page.
					</div>
				) : displayNames.length === 0 ? (
					<div className={panelStyles.empty}>
						No names available yet. Start a tournament to see results here!
					</div>
				) : (
					<>
						<div className={viewToggleStyles.viewToggle}>
							{["chart", "table", "insights"].map((mode) => (
								<button
									key={mode}
									type="button"
									className={`${viewToggleStyles.viewBtn} ${viewMode === mode ? viewToggleStyles.active : ""}`}
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
							<div className={viewToggleStyles.chartContainer}>
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

