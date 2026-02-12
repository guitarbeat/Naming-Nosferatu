/**
 * @module Dashboard
 * @description Single unified dashboard component for the application.
 * Provides personal rankings, global analytics, and a random name generator.
 */

import { ButtonGroup, CardBody, Button as HeroButton, Spinner } from "@heroui/react";
import { Suspense, useCallback, useMemo, useState } from "react";
import { useCollapsible } from "@/hooks/useBrowserState";
import { BumpChart } from "@/layout/Charts";
import { Card } from "@/layout/Card";
import { CollapsibleContent, CollapsibleHeader } from "@/layout/CollapsibleHeader";
import { EmptyState } from "@/layout/EmptyState";
import { FloatingBubblesContainer } from "@/layout/LayoutEffects";
import type { NameItem } from "@/types/appTypes";
import { clearAllCaches, devError } from "@/utils/basic";
import { STORAGE_KEYS } from "@/utils/constants";
import { hiddenNamesAPI } from "../../services/supabase/client";
import { useNameManagementContextOptional } from "../tournament/context/NameManagementContext";
import { AnalysisInsights, AnalysisPanel, AnalysisTable } from "./AnalysisComponents";
import { useAnalysisData, useAnalysisDisplayData } from "./analyticsHooks";
import type {
	AnalysisDashboardProps,
	AnalyticsDataItem,
	LeaderboardItem,
	SelectionPopularityItem,
} from "./analyticsService";

// Modular Components
import { PersonalResults } from "./PersonalResults";
import { RandomGenerator } from "./RandomGenerator";

/* =========================================================================
   ANALYSIS DASHBOARD COMPONENT (Merged AnalysisDashboard)
   ========================================================================= */

function AnalysisDashboard({
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

	// Collapsed state
	const { isCollapsed, toggleCollapsed } = useCollapsible(
		STORAGE_KEYS.ANALYSIS_DASHBOARD_COLLAPSED,
		defaultCollapsed,
	);

	// Context for filtering
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

	// Fetch Data
	const {
		leaderboardData,
		selectionPopularity,
		analyticsData,
		rankingHistory,
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

	// Process Data
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

	const handleNameHidden = useCallback(
		async (nameId: number | string) => {
			try {
				await hiddenNamesAPI.hideName(userName || "admin", String(nameId));
				await clearAllCaches();
				refetch();
				onNameHidden?.(String(nameId));
			} catch (err) {
				devError("Failed to hide name from dashboard:", err);
			}
		},
		[refetch, onNameHidden, userName],
	);

	if (!showGlobalLeaderboard) {
		return null;
	}

	return (
		<div className="w-full max-w-[95%] mx-auto px-4 py-8 animate-in fade-in duration-500">
			<FloatingBubblesContainer
				data={(displayNames || []).map((n) => ({
					id: String(n.id),
					label: n.name,
					value: n.rating,
				}))}
			/>

			<CollapsibleContent isCollapsed={isCollapsed}>
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
					<div className="lg:col-span-2 space-y-6">
						{/* Chart Section */}
						<Card className="min-h-[400px] relative overflow-hidden backdrop-blur-md bg-white/5 border-white/10">
							<div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none" />
							<CardBody className="p-6">
								<div className="flex justify-between items-center mb-6">
									<div>
										<h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-pink-200">
											Popularity Trends
										</h3>
										<p className="text-small text-default-400">Rating history over time</p>
									</div>
									<ButtonGroup size="sm" variant="flat">
										<HeroButton
											className={viewMode === "chart" ? "bg-white/20" : ""}
											onPress={() => setViewMode("chart")}
										>
											Chart
										</HeroButton>
										<HeroButton
											className={viewMode === "table" ? "bg-white/20" : ""}
											onPress={() => setViewMode("table")}
										>
											Table
										</HeroButton>
									</ButtonGroup>
								</div>

								{isLoading ? (
									<div className="h-[300px] flex items-center justify-center">
										<Spinner size="lg" color="secondary" />
									</div>
								) : error ? (
									<div className="h-[300px] flex items-center justify-center text-danger">
										<p>Failed to load analytics data</p>
										<HeroButton size="sm" variant="light" onPress={() => refetch()}>
											Retry
										</HeroButton>
									</div>
								) : viewMode === "chart" ? (
									<div className="h-[300px] w-full">
										{rankingHistory?.data && rankingHistory.data.length > 0 ? (
											<BumpChart
												data={(rankingHistory.data || []).map(
													(d: { name: string; rankings?: (number | null)[] }) => ({
														...d,
														rankings: (d.rankings || []).map((r: number | null) => r ?? 0),
													}),
												)}
												labels={rankingHistory.timeLabels}
												title="Ranking History"
											/>
										) : (
											<EmptyState
												icon="📊"
												title="No trend data"
												description="Play more matches to generate history!"
											/>
										)}
									</div>
								) : (
									<div className="h-[300px] overflow-auto">
										<AnalysisTable
											names={displayNames}
											sortField={sortField}
											sortDirection={sortDirection}
											onSort={(field) => {
												if (field === sortField) {
													setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
												} else {
													setSortField(field);
													setSortDirection("desc");
												}
											}}
											isAdmin={isAdmin}
											canHideNames={isAdmin}
											onHideName={handleNameHidden}
											summaryStats={summaryStats}
										/>
									</div>
								)}
							</CardBody>
						</Card>
					</div>

					<div className="space-y-6">
						{/* Insights Panel */}
						<AnalysisPanel title="Stats & Insights">
							<AnalysisInsights
								namesWithInsights={namesWithInsights}
								summaryStats={summaryStats}
								generalInsights={generalInsights}
								isAdmin={isAdmin}
								canHideNames={isAdmin}
								onHideName={handleNameHidden}
							/>
						</AnalysisPanel>

						{/* Top Performers */}
						<AnalysisPanel title="Leaderboard">
							<div className="space-y-2">
								{displayNames.slice(0, 5).map((name, idx) => (
									<div
										key={name.id}
										className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
									>
										<div className="flex items-center gap-3">
											<span
												className={`
												flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
												${
													idx === 0
														? "bg-yellow-400 text-black"
														: idx === 1
															? "bg-gray-300 text-black"
															: idx === 2
																? "bg-amber-600 text-white"
																: "bg-white/10 text-white/50"
												}
											`}
											>
												{idx + 1}
											</span>
											<span className="font-medium text-white/90">{name.name}</span>
										</div>
										<span className="font-mono text-sm text-purple-300">
											{Math.round(name.rating)}
										</span>
									</div>
								))}
							</div>
						</AnalysisPanel>
					</div>
				</div>
			</CollapsibleContent>

			<CollapsibleHeader
				title={isCollapsed ? "Show Global Analytics" : "Hide Analytics"}
				isCollapsed={isCollapsed}
				onToggle={toggleCollapsed}
			/>
		</div>
	);
}

/* =========================================================================
   DASHBOARD WRAPPER (Main Export)
   ========================================================================= */

const TABS = [
	{ id: "results", label: "My Ranking", icon: "📊" },
	{ id: "community", label: "Global Ranks", icon: "🌍" },
	{ id: "random", label: "Surprise Me", icon: "🎲" },
];

export function Dashboard({
	personalRatings,
	currentTournamentNames,
	onStartNew,
	onUpdateRatings,
	userName,
}: {
	personalRatings?: Record<string, unknown>;
	currentTournamentNames?: NameItem[];
	onStartNew: () => void;
	onUpdateRatings: (
		ratings: Record<string, { rating: number; wins?: number; losses?: number }>,
	) => void;
	userName: string;
}) {
	const [activeTab, setActiveTab] = useState("results");

	return (
		<div className="w-full max-w-[95%] mx-auto px-4 pb-20 pt-8" id="analysis">
			<div className="bg-white/5 p-1 rounded-xl flex gap-1 overflow-x-auto max-w-full mx-auto mb-8 justify-center">
				{TABS.map((tab) => (
					<button
						key={tab.id}
						onClick={() => setActiveTab(tab.id)}
						className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
							activeTab === tab.id
								? "bg-white/10 text-white shadow-sm"
								: "text-white/50 hover:text-white/80 hover:bg-white/5"
						}`}
					>
						<span>{tab.icon}</span>
						<span>{tab.label}</span>
					</button>
				))}
			</div>

			<div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
				{activeTab === "results" && (
					<PersonalResults
						personalRatings={personalRatings}
						currentTournamentNames={currentTournamentNames}
						onStartNew={onStartNew}
						onUpdateRatings={onUpdateRatings}
						userName={userName}
					/>
				)}
				{activeTab === "community" && (
					<Suspense
						fallback={
							<div className="flex justify-center p-8">
								<Spinner size="lg" color="secondary" />
							</div>
						}
					>
						<AnalysisDashboard
							userName={userName}
							showGlobalLeaderboard={true}
							defaultCollapsed={false}
							isAdmin={false}
						/>
					</Suspense>
				)}
				{activeTab === "random" && <RandomGenerator userName={userName} />}
			</div>
		</div>
	);
}
