/**
 * @module AnalyticsDashboard
 * @description Consolidated analytics components for Naming Nosferatu.
 * Shows top performing names to help users choose a name for their cat.
 * Displays a consolidated table, insights, and a bump chart.
 */

import { FloatingBubblesContainer } from "@components/FloatingBubblesContainer";
import {
	Button,
	ButtonGroup,
	CardBody,
	Chip,
	cn,
	Progress,
	Spinner,
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
} from "@heroui/react";
import { hiddenNamesAPI } from "@supabase/client";
import { clearAllCaches, devError, formatDate, getMetricLabel, getRankDisplay } from "@utils";
import React, { useCallback, useMemo, useState } from "react";
import { Card } from "@/components/Card";
import { BumpChart } from "@/components/Charts";
import { CollapsibleContent, CollapsibleHeader } from "@/components/CollapsibleHeader";
import { EmptyState } from "@/components/EmptyState";
import { useNameManagementContextOptional } from "@/components/nameManagementCore";
import { PerformanceBadges } from "@/components/PerformanceBadge";
import { STORAGE_KEYS } from "@/constants";
import { useCollapsible } from "@/hooks/useStorage";
import { TournamentToolbar } from "../../shared/components/TournamentToolbar";

import type {
	AnalysisDashboardProps,
	AnalyticsDataItem,
	ConsolidatedName,
	LeaderboardItem,
	NameWithInsight,
	SummaryStats,
} from "./types";
import { useAnalysisData } from "./useAnalysisData";
import { useAnalysisDisplayData } from "./useAnalysisDisplayData";

/* =========================================================================
   SUB-COMPONENTS
   ========================================================================= */

/**
 * ColumnHeader Component for sortable tables
 */

/**
 * AnalysisTable Component showing local/global leaderboard
 */
const AnalysisTable: React.FC<{
	names: ConsolidatedName[];
	isAdmin: boolean;
	canHideNames: boolean;
	sortField: string;
	sortDirection: string;
	onSort: (field: string) => void;
	onHideName: (id: string | number, name: string) => Promise<void>;
	summaryStats: SummaryStats | null;
}> = ({
	names,
	isAdmin,
	canHideNames,
	sortField,
	sortDirection,
	onSort,
	onHideName,
	summaryStats,
}) => {
	const columns = useMemo(() => {
		const cols = [
			{ key: "rank", label: "Rank" },
			{ key: "name", label: "Name" },
			{ key: "rating", label: isAdmin ? getMetricLabel("rating") : "Rating", sortable: true },
			{ key: "wins", label: isAdmin ? getMetricLabel("total_wins") : "Wins", sortable: true },
			{
				key: "selected",
				label: isAdmin ? getMetricLabel("times_selected") : "Selected",
				sortable: true,
			},
		];

		if (isAdmin) {
			cols.push({ key: "insights", label: "Insights" });
		}

		cols.push({
			key: "dateSubmitted",
			label: isAdmin ? getMetricLabel("created_at") : "Date",
			sortable: true,
		});

		if (canHideNames) {
			cols.push({ key: "actions", label: "Actions" });
		}
		return cols;
	}, [isAdmin, canHideNames]);

	const renderCell = useCallback(
		(item: ConsolidatedName, columnKey: React.Key) => {
			const rank = names.findIndex((n) => n.id === item.id) + 1;
			const ratingPercent =
				summaryStats && (summaryStats.maxRating ?? 0) > 0
					? Math.min((item.rating / (summaryStats.maxRating ?? 1)) * 100, 100)
					: 0;
			const winsPercent =
				summaryStats && (summaryStats.maxWins ?? 0) > 0
					? Math.min((item.wins / (summaryStats.maxWins ?? 1)) * 100, 100)
					: 0;
			const selectedPercent =
				summaryStats && (summaryStats.maxSelected ?? 0) > 0
					? Math.min((item.selected / (summaryStats.maxSelected ?? 1)) * 100, 100)
					: 0;

			switch (columnKey) {
				case "rank":
					return (
						<Chip
							size="sm"
							variant="flat"
							className={cn(
								"border-none",
								rank <= 3 ? "bg-yellow-500/20 text-yellow-300" : "bg-white/10 text-white/60",
							)}
						>
							{isAdmin ? getRankDisplay(rank) : rank}
						</Chip>
					);
				case "name":
					return <span className="font-bold text-white">{item.name}</span>;
				case "rating":
					return (
						<div className="flex flex-col gap-1 min-w-[100px]">
							<div className="flex justify-between text-xs">
								<span>{Math.round(item.rating)}</span>
								{isAdmin && <span className="text-white/40">{item.ratingPercentile}%ile</span>}
							</div>
							{!isAdmin && (
								<Progress value={ratingPercent} color="warning" size="sm" aria-label="Rating" />
							)}
						</div>
					);
				case "wins":
					return (
						<div className="flex flex-col gap-1 min-w-[80px]">
							<span className="text-xs">{item.wins}</span>
							{!isAdmin && (
								<Progress value={winsPercent} color="success" size="sm" aria-label="Wins" />
							)}
						</div>
					);
				case "selected":
					return (
						<div className="flex flex-col gap-1 min-w-[80px]">
							<span className="text-xs">{item.selected}</span>
							{isAdmin && <span className="text-white/40">{item.selectedPercentile}%ile</span>}
							{!isAdmin && (
								<Progress
									value={selectedPercent}
									color="secondary"
									size="sm"
									aria-label="Selected"
								/>
							)}
						</div>
					);
				case "insights":
					return isAdmin ? (
						<PerformanceBadges
							types={Array.isArray(item.insights) ? (item.insights as string[]) : []}
						/>
					) : null;
				case "dateSubmitted":
					return (
						<span className="text-xs text-white/50">
							{item.dateSubmitted
								? formatDate(item.dateSubmitted, {
										month: "short",
										day: "numeric",
										year: "numeric",
									})
								: "—"}
						</span>
					);
				case "actions":
					return canHideNames ? (
						<Button
							size="sm"
							color="danger"
							variant="light"
							onPress={async () => {
								try {
									await onHideName(item.id, item.name);
								} catch (error) {
									devError("[AnalysisDashboard] Failed to hide name:", error);
								}
							}}
						>
							Hide
						</Button>
					) : null;
				default:
					return null;
			}
		},
		[names, summaryStats, isAdmin, canHideNames, onHideName],
	);

	return (
		<div className="w-full overflow-x-auto">
			<Table
				aria-label="Analytics Table"
				sortDescriptor={{
					column: sortField,
					direction: sortDirection === "asc" ? "ascending" : "descending",
				}}
				onSortChange={(descriptor) => onSort(descriptor.column as string)}
				classNames={{
					wrapper: "bg-white/5 border border-white/5",
					th: "bg-white/10 text-white/60",
					td: "text-white/80 py-3",
				}}
				removeWrapper={true}
			>
				<TableHeader columns={columns}>
					{(column) => (
						<TableColumn key={column.key} allowsSorting={!!column.sortable}>
							{column.label}
						</TableColumn>
					)}
				</TableHeader>
				<TableBody items={names}>
					{(item) => (
						<TableRow key={item.id}>
							{(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
};

/**
 * AnalysisInsights Component showing data highlights
 */
const AnalysisInsights: React.FC<{
	namesWithInsights: NameWithInsight[];
	summaryStats: SummaryStats | null;
	generalInsights: Array<{ type: string; message: string; icon: string }>;
	isAdmin: boolean;
	canHideNames: boolean;
	onHideName: (id: string | number, name: string) => Promise<void>;
}> = ({ namesWithInsights, summaryStats, generalInsights, isAdmin, canHideNames, onHideName }) => {
	const renderStatsSummary = () => {
		if (!summaryStats) {
			return null;
		}

		if (isAdmin) {
			return (
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
					<Card variant="default">
						<CardBody className="gap-1">
							<div className="text-white/60 text-sm">Total Names</div>
							<div className="text-2xl font-bold text-white">{summaryStats.totalNames || 0}</div>
							<div className="text-xs text-white/40">{summaryStats.activeNames || 0} active</div>
						</CardBody>
					</Card>
					<Card variant="default">
						<CardBody className="gap-1">
							<div className="text-white/60 text-sm">Avg Rating</div>
							<div className="text-2xl font-bold text-white">{summaryStats.avgRating}</div>
							<div className="text-xs text-white/40">Global Average</div>
						</CardBody>
					</Card>
					<Card variant="default">
						<CardBody className="gap-1">
							<div className="text-white/60 text-sm">Total Votes</div>
							<div className="text-2xl font-bold text-white">{summaryStats.totalRatings || 0}</div>
							<div className="text-xs text-white/40">
								{summaryStats.totalSelections || 0} selections
							</div>
						</CardBody>
					</Card>
				</div>
			);
		}

		return (
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
				<Card variant="warning">
					<CardBody className="gap-1">
						<div className="text-yellow-500/80 text-sm">Top Rating</div>
						<div className="text-2xl font-bold text-yellow-500">{summaryStats.maxRating ?? 0}</div>
						<div className="text-xs text-yellow-500/60 truncate">{summaryStats.topName?.name}</div>
					</CardBody>
				</Card>
				<Card variant="default">
					<CardBody className="gap-1">
						<div className="text-white/60 text-sm">Avg Rating</div>
						<div className="text-2xl font-bold text-white">{summaryStats.avgRating}</div>
						<div className="text-xs text-white/40">Across {namesWithInsights.length} names</div>
					</CardBody>
				</Card>
				<Card variant="default">
					<CardBody className="gap-1">
						<div className="text-white/60 text-sm">Total Selected</div>
						<div className="text-2xl font-bold text-white">{summaryStats.totalSelected ?? 0}</div>
						<div className="text-xs text-white/40">
							{(summaryStats.maxSelected ?? 0) > 0
								? `Most: ${summaryStats.maxSelected}x`
								: "No selections yet"}
						</div>
					</CardBody>
				</Card>
			</div>
		);
	};

	const renderGeneralInsights = () => {
		if (generalInsights.length === 0 || isAdmin) {
			return null;
		}
		return (
			<div className="flex flex-col gap-3 mb-6">
				{generalInsights.map((insight, idx) => (
					<Card key={idx} variant={insight.type === "warning" ? "warning" : "info"}>
						<CardBody className="flex flex-row items-center gap-3 p-3">
							<span className="text-lg">{insight.icon}</span>
							<span className="text-white/80 text-sm">{insight.message}</span>
						</CardBody>
					</Card>
				))}
			</div>
		);
	};

	const renderActionableInsights = () => {
		const highPriorityTags = ["worst_rated", "never_selected", "inactive", "poor_performer"];
		const lowPerformers = namesWithInsights.filter((n) =>
			n.insights.some((i: string) => highPriorityTags.includes(i)),
		);

		if (lowPerformers.length === 0) {
			return null;
		}

		return (
			<div className="mb-6">
				<h3 className="text-lg font-bold text-white mb-3">⚠️ Names to Consider Hiding</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
					{lowPerformers
						.sort((a, b) => {
							const priority: Record<string, number> = {
								inactive: 0,
								never_selected: 1,
								worst_rated: 2,
								poor_performer: 3,
							};
							const getP = (item: NameWithInsight) =>
								Math.min(
									...item.insights
										.filter((i: string) => highPriorityTags.includes(i))
										.map((i: string) => priority[i] ?? 99),
								);
							const pA = getP(a);
							const pB = getP(b);
							if (pA !== pB) {
								return pA - pB;
							}
							return a.rating - b.rating;
						})
						.slice(0, 12)
						.map((n) => (
							<Card key={n.id} variant="danger">
								<CardBody className="p-3 gap-2">
									<div className="flex justify-between items-start">
										<div className="font-bold text-white truncate pr-2">{n.name}</div>
										{canHideNames && (
											<Button
												size="sm"
												color="danger"
												variant="flat"
												className="min-w-0 h-6 px-2 text-xs"
												onPress={async () => {
													try {
														await onHideName(n.id, n.name);
													} catch (error) {
														devError("[AnalysisDashboard] Failed to hide name:", error);
													}
												}}
											>
												Hide
											</Button>
										)}
									</div>
									<div className="flex gap-3 text-xs text-white/60">
										<span>Rating {Math.round(n.rating)}</span>
										<span>{n.selected} sel</span>
										{n.wins > 0 && <span>{n.wins} wins</span>}
									</div>
									<div className="flex flex-wrap gap-1 mt-1">
										{n.insights
											.filter((i: string) => highPriorityTags.includes(i))
											.map((tag: string) => (
												<Chip
													key={tag}
													size="sm"
													color="warning"
													variant="flat"
													className="h-5 text-[10px]"
												>
													{tag.replace("_", " ")}
												</Chip>
											))}
									</div>
								</CardBody>
							</Card>
						))}
				</div>
			</div>
		);
	};

	const renderPositiveInsights = () => {
		const positiveTags = ["top_rated", "most_selected", "underrated", "undefeated"];
		const topPerformers = namesWithInsights.filter((n) =>
			n.insights.some((i: string) => positiveTags.includes(i)),
		);

		if (topPerformers.length === 0) {
			return null;
		}

		return (
			<div className="mb-6">
				<h3 className="text-lg font-bold text-white mb-3">✨ Top Performers (Keep)</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
					{topPerformers.slice(0, 6).map((n) => (
						<Card key={n.id} variant="primary">
							<CardBody className="p-3 gap-2">
								<div className="font-bold text-white">{n.name}</div>
								<div className="flex gap-3 text-xs text-white/60">
									<span>Rating {Math.round(n.rating)}</span>
									<span>{n.selected} sel</span>
								</div>
								<div className="flex flex-wrap gap-1 mt-1">
									{n.insights
										.filter((i: string) => positiveTags.includes(i))
										.map((tag: string) => (
											<Chip
												key={tag}
												size="sm"
												color="secondary"
												variant="flat"
												className="h-5 text-[10px]"
											>
												{tag.replace("_", " ")}
											</Chip>
										))}
								</div>
							</CardBody>
						</Card>
					))}
				</div>
			</div>
		);
	};

	return (
		<div className="flex flex-col gap-6">
			{renderStatsSummary()}
			{renderGeneralInsights()}
			{renderActionableInsights()}
			{renderPositiveInsights()}
		</div>
	);
};

/**
 * AnalysisPanel Wrapper Component
 */
const AnalysisPanel: React.FC<{
	children: React.ReactNode;
	title?: string;
	actions?: React.ReactNode;
	showHeader?: boolean;
	toolbar?: React.ReactNode;
	className?: string;
}> = ({ children, title, actions, showHeader = true, toolbar, className = "" }) => {
	return (
		<div className={cn("flex flex-col gap-4", className)}>
			{showHeader && <CollapsibleHeader title={title || ""} actions={actions} variant="compact" />}
			{toolbar && <div className="flex gap-2">{toolbar}</div>}
			{children}
		</div>
	);
};

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
