/**
 * @module AnalyticsDashboard
 * @description Consolidated analytics components for Naming Nosferatu.
 * Shows top performing names to help users choose a name for their cat.
 * Displays a consolidated table, insights, and a bump chart.
 */

import { Button, ButtonGroup, cn, Spinner } from "@heroui/react";
import { hiddenNamesAPI } from "@supabase/client";
import { clearAllCaches, devError } from "@utils";
import { useCallback, useMemo, useState } from "react";
import { STORAGE_KEYS } from "@/constants";
import { CollapsibleContent, CollapsibleHeader } from "@/features/layout/CollapsibleHeader";
import { FloatingBubblesContainer } from "@/features/layout/FloatingBubbles";
import { useNameManagementContextOptional } from "@/features/tournament/nameManagementCore";
import { TournamentToolbar } from "@/features/tournament/TournamentToolbar";
import { BumpChart } from "@/features/ui/Charts";
import { EmptyState } from "@/features/ui/EmptyState";
import { useCollapsible } from "@/hooks/useBrowserState";
import { useAnalysisData, useAnalysisDisplayData } from "./analyticsHooks";
import type {
	AnalysisDashboardProps,
	AnalyticsDataItem,
	LeaderboardItem,
	SelectionPopularityItem,
} from "./analyticsService";
import { AnalysisInsights } from "./components/AnalysisInsights";
import { AnalysisPanel } from "./components/AnalysisPanel";
import { AnalysisTable } from "./components/AnalysisTable";

/* =========================================================================
   MAIN COMPONENT
   ========================================================================= */

export function AnalysisDashboard({
	highlights,
	userName,
	showGlobalLeaderboard = true,
	defaultCollapsed = false,
	isAdmin = false,
	onNameHidden,
}: AnalysisDashboardProps) {
	const [viewMode, setViewMode] = useState("chart"); // "chart" | "table" | "insights" | "cloud"
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
			selectionPopularity: (selectionPopularity ?? null) as SelectionPopularityItem[] | null,
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
			// Categories removed
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
					<div
						className="flex justify-center p-8 bg-white/5 rounded-lg border border-white/5"
						role="status"
					>
						<Spinner label="Loading top names..." color="secondary" />
					</div>
				) : error ? (
					<div
						className="p-8 text-center bg-red-500/10 border border-red-500/20 rounded-lg text-red-200"
						role="alert"
					>
						Unable to load names. Please try refreshing the page.
					</div>
				) : displayNames.length === 0 ? (
					<EmptyState
						title="No names available yet"
						description="Start a tournament to see results and analysis here!"
						icon="📊"
						className="p-8 bg-white/5 border border-white/5 rounded-lg"
					/>
				) : (
					<>
						<div className="flex justify-center mb-6">
							<ButtonGroup variant="flat" className="bg-white/5 rounded-lg p-1">
								{["chart", "table", "insights", "cloud"].map((mode) => (
									<Button
										key={mode}
										className={cn(
											viewMode === mode
												? "bg-white/10 text-white"
												: "text-white/50 hover:text-white",
										)}
										onPress={() => setViewMode(mode)}
									>
										{mode === "chart"
											? "📊 Bump Chart"
											: mode === "table"
												? "📋 Table"
												: mode === "insights"
													? "💡 Insights"
													: "🫧 Cloud"}
									</Button>
								))}
							</ButtonGroup>
						</div>

						<div className="animate-in fade-in zoom-in-95 duration-300">
							{viewMode === "chart" && rankingHistory && (
								<div className="p-4 bg-white/5 border border-white/5 rounded-xl">
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

							{viewMode === "cloud" && (
								<div className="p-4 bg-white/5 border border-white/5 rounded-xl h-[500px]">
									<FloatingBubblesContainer
										data={displayNames.map((n) => ({
											id: String(n.id),
											label: n.name,
											value: n.rating,
										}))}
										height={460}
									/>
								</div>
							)}
						</div>
					</>
				)}
			</CollapsibleContent>
		</AnalysisPanel>
	);
}
