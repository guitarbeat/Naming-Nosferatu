/**
 * @module AnalysisDashboard
 * @description Shows top performing names to help users choose a name for their cat.
 * Displays a consolidated table with Rating, Wins, and Selected counts.
 * Includes a bump chart visualization showing ranking changes over time.
 */

import PropTypes from "prop-types";
import { useCallback, useMemo, useState } from "react";
import { STORAGE_KEYS } from "../../../core/constants";
import { useCollapsible } from "../../../core/hooks/useStorage";
import { nameItemShape } from "../../propTypes";
import { hiddenNamesAPI } from "../../services/supabase/supabaseClient";
import { clearAllCaches, devError } from "../../utils/coreUtils";
import { AnalysisPanel } from "../AnalysisPanel/AnalysisPanel";
import { BumpChart } from "../Charts/Charts";
import {
	CollapsibleContent,
	CollapsibleHeader,
} from "../CollapsibleHeader/CollapsibleHeader";
import { useNameManagementContextSafe } from "../NameManagementView/NameManagementView";
import { TournamentToolbar } from "../TournamentToolbar/TournamentToolbar";
import "./AnalysisDashboard.css";
import { AnalysisInsights } from "./components/AnalysisInsights";
import { AnalysisTable } from "./components/AnalysisTable";
import { useAnalysisData } from "./useAnalysisData";
import { useAnalysisDisplayData } from "./useAnalysisDisplayData";

/**
 * Analysis Dashboard Component
 * Shows top performing names to help users choose a name for their cat
 */
interface AnalysisDashboardProps {
	highlights?: { topRated?: unknown[]; mostWins?: unknown[] };
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
			leaderboardData,
			selectionPopularity,
			analyticsData,
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
		async (nameId: string, _name: string) => {
			if (!isAdmin || !userName) return;
			try {
				await hiddenNamesAPI.hideName(userName, nameId);
				clearAllCaches();
				if (onNameHidden) onNameHidden(nameId);
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
					<div className="analysis-loading" role="status">
						Loading top names...
					</div>
				) : error ? (
					<div className="analysis-error" role="alert">
						Failed to load top names.
					</div>
				) : displayNames.length === 0 ? (
					<div className="analysis-empty">No names available yet.</div>
				) : (
					<>
						<div className="analysis-view-toggle">
							{["chart", "table", "insights"].map((mode) => (
								<button
									key={mode}
									type="button"
									className={`analysis-view-btn ${viewMode === mode ? "active" : ""}`}
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
							<div className="analysis-chart-container">
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
								summaryStats={isAdmin ? siteStats : summaryStats}
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
