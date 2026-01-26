/**
 * @module Dashboard
 * @description Consolidated dashboard component.
 * Combines UnifiedDashboard and AnalysisDashboard into a single view.
 */

import {
	ButtonGroup,
	CardBody,
	Chip,
	cn,
	Button as HeroButton,
	Progress,
	Spinner,
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
} from "@heroui/react";
import { coreAPI, hiddenNamesAPI } from "@supabase/client";
import { Copy, Download, Heart, Plus, Shuffle } from "lucide-react";
import React, { Suspense, useCallback, useMemo, useState } from "react";
import { STORAGE_KEYS } from "@/constants";
import { useNameManagementContextOptional } from "@/features/tournament/NameManagementContext";
import { RankingAdjustment } from "@/features/tournament/RankingAdjustment";
import { TournamentToolbar } from "@/features/tournament/TournamentToolbar";
import { usePersonalResults } from "@/features/tournament/usePersonalResults";
import useLocalStorage, { useCollapsible } from "@/hooks/useBrowserState";
import { Card } from "@/layout/Card";
import { BumpChart } from "@/layout/Charts";
import { CollapsibleContent, CollapsibleHeader } from "@/layout/CollapsibleHeader";
import { EmptyState } from "@/layout/EmptyState";
import { FloatingBubblesContainer } from "@/layout/FloatingBubbles";
import { PerformanceBadges } from "@/layout/StatusIndicators";
import { useToast } from "@/providers/ToastProvider";
import type {
	AnalysisDashboardProps,
	AnalyticsDataItem,
	ConsolidatedName,
	LeaderboardItem,
	NameWithInsight,
	SelectionPopularityItem,
	SummaryStats,
} from "@/services/analyticsService";
import type { NameItem } from "@/types";
import {
	clearAllCaches,
	devError,
	exportTournamentResultsToCSV,
	formatDate,
	getMetricLabel,
	getRankDisplay,
} from "@/utils";
import { useAnalysisData, useAnalysisDisplayData } from "./analyticsHooks";

/* =========================================================================
   PERSONAL RESULTS COMPONENT (from UnifiedDashboard)
   ========================================================================= */

const PersonalResults = ({
	personalRatings,
	currentTournamentNames,
	onStartNew,
	onUpdateRatings,
}: {
	personalRatings: Record<string, unknown> | undefined;
	currentTournamentNames?: NameItem[];
	onStartNew: () => void;
	onUpdateRatings: (
		ratings: Record<string, { rating: number; wins?: number; losses?: number }>,
	) => void;
	userName?: string;
}) => {
	const { rankings } = usePersonalResults({ personalRatings, currentTournamentNames });
	const { showToast } = useToast();

	return (
		<div className="flex flex-col gap-6 w-full">
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card variant="warning" className="backdrop-blur-sm">
					<CardBody className="flex flex-col items-center justify-center gap-2 p-6">
						<span className="text-4xl select-none">🏆</span>
						<h3 className="text-sm font-medium text-white/60">Champion</h3>
						<p className="text-xl font-bold text-white truncate max-w-full">
							{rankings[0]?.name || "-"}
						</p>
					</CardBody>
				</Card>

				<Card variant="primary" className="backdrop-blur-sm">
					<CardBody className="flex flex-col items-center justify-center gap-2 p-6">
						<span className="text-4xl select-none">⭐</span>
						<h3 className="text-sm font-medium text-white/60">Highest Rated</h3>
						<p className="text-xl font-bold text-white">{String(rankings[0]?.rating || 1500)}</p>
					</CardBody>
				</Card>

				<Card variant="info" className="backdrop-blur-sm">
					<CardBody className="flex flex-col items-center justify-center gap-2 p-6">
						<span className="text-4xl select-none">📝</span>
						<h3 className="text-sm font-medium text-white/60">Names Ranked</h3>
						<p className="text-xl font-bold text-white">{rankings.length}</p>
					</CardBody>
				</Card>
			</div>

			<RankingAdjustment
				rankings={rankings}
				onSave={async (r: NameItem[]) => {
					const ratingsMap = Object.fromEntries(
						r.map((n) => [n.name, { rating: n.rating as number, wins: n.wins, losses: n.losses }]),
					);
					await onUpdateRatings(ratingsMap);
					showToast("Updated!", "success");
				}}
				onCancel={onStartNew}
			/>

			<div className="flex flex-wrap gap-3 justify-end">
				<HeroButton
					onClick={onStartNew}
					variant="flat"
					className="bg-purple-500/20 hover:bg-purple-500/30 text-white"
					startContent={<Plus size={18} />}
				>
					New Tournament
				</HeroButton>
				<HeroButton
					variant="flat"
					className="bg-white/5 hover:bg-white/10 text-white"
					startContent={<Download size={18} />}
					onClick={() => {
						if (!rankings.length) {
							return;
						}
						exportTournamentResultsToCSV(rankings);
					}}
				>
					Export CSV
				</HeroButton>
			</div>
		</div>
	);
};

/* =========================================================================
   RANDOM GENERATOR COMPONENT (from UnifiedDashboard)
   ========================================================================= */

const RandomGenerator: React.FC<{ userName: string }> = ({ userName: _userName }) => {
	const [generatedName, setGeneratedName] = useState<string | null>(null);
	const [isGenerating, setIsGenerating] = useState(false);
	const [storedFavorites, setStoredFavorites] = useLocalStorage<string[]>("cat_name_favorites", []);
	const favorites = useMemo(() => new Set(storedFavorites), [storedFavorites]);

	const generateName = async () => {
		setIsGenerating(true);
		try {
			const allNames = await coreAPI.getTrendingNames();
			if (allNames.length > 0) {
				const random = allNames[Math.floor(Math.random() * allNames.length)];
				if (random) {
					setGeneratedName(random.name);
				}
			} else {
				setGeneratedName("Luna");
			}
		} catch (e) {
			console.error(e);
			setGeneratedName("Oliver");
		} finally {
			setIsGenerating(false);
		}
	};

	const copyToClipboard = async (name: string) => {
		try {
			await navigator.clipboard.writeText(name);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	const toggleFavorite = (name: string) => {
		const newFavorites = new Set(favorites);
		if (newFavorites.has(name)) {
			newFavorites.delete(name);
		} else {
			newFavorites.add(name);
		}
		setStoredFavorites(Array.from(newFavorites));
	};

	return (
		<div className="flex flex-col max-w-2xl mx-auto w-full">
			<h2 className="text-2xl font-bold text-white text-center mb-2">Random Name Generator</h2>
			<p className="text-white/60 text-center mb-8">Can't decide? Let fate decide for you.</p>

			<Card className="w-full min-h-[240px]">
				<CardBody className="flex flex-col items-center justify-center gap-8 py-12">
					<div className="text-center w-full min-h-[100px] flex flex-col items-center justify-center">
						{isGenerating ? (
							<div className="flex flex-col items-center gap-4">
								<Spinner size="lg" color="secondary" />
							</div>
						) : generatedName ? (
							<div className="flex flex-col items-center gap-6 animate-in zoom-in-95 leading-none">
								<h3 className="text-5xl md:text-6xl font-black text-white/90 tracking-tight drop-shadow-2xl">
									{generatedName}
								</h3>
								<div className="flex gap-2">
									<HeroButton
										isIconOnly={true}
										variant="flat"
										className="bg-white/5 hover:bg-white/10 text-white"
										onPress={() => toggleFavorite(generatedName)}
									>
										<Heart
											size={20}
											className={favorites.has(generatedName) ? "fill-pink-500 text-pink-500" : ""}
										/>
									</HeroButton>
									<HeroButton
										isIconOnly={true}
										variant="flat"
										className="bg-white/5 hover:bg-white/10 text-white"
										onPress={() => copyToClipboard(generatedName)}
									>
										<Copy size={20} />
									</HeroButton>
								</div>
							</div>
						) : (
							<div className="text-white/20 flex flex-col items-center gap-2">
								<Shuffle size={48} />
								<p>Tap to generate</p>
							</div>
						)}
					</div>

					<HeroButton
						size="lg"
						className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold px-8 shadow-lg shadow-purple-900/20"
						onPress={generateName}
						isDisabled={isGenerating}
					>
						{isGenerating ? "Generating..." : "Generate Name"}
					</HeroButton>
				</CardBody>
			</Card>

			{favorites.size > 0 && (
				<div className="flex flex-col gap-4">
					<h3 className="text-lg font-semibold text-white/80 flex items-center gap-2">
						<Heart size={16} className="text-pink-500 fill-pink-500" />
						Favorites
					</h3>
					<div className="flex flex-wrap gap-2">
						{Array.from(favorites).map((name) => (
							<React.Fragment key={name}>
								<div className="bg-white/5 border border-white/10 pl-2 pr-1 py-1 rounded-full flex items-center gap-1">
									<span className="text-sm">{name}</span>
									<button
										onClick={() => toggleFavorite(name)}
										className="hover:bg-white/10 rounded-full p-1"
									>
										<span className="text-xs">✕</span>
									</button>
								</div>
							</React.Fragment>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

/* =========================================================================
   ANALYSIS DASHBOARD COMPONENTS
   ========================================================================= */

// --- AnalysisPanel ---

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

// --- AnalysisTable ---

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
						<HeroButton
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
						</HeroButton>
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

// --- AnalysisInsights ---

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
											<HeroButton
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
											</HeroButton>
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

/* =========================================================================
   ANALYSIS DASHBOARD COMPONENT (Merged AnalysisDashboard)
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
		[refetch, onNameHidden],
	);

	if (!showGlobalLeaderboard) {
		return null;
	}

	return (
		<div className="w-full max-w-[1200px] mx-auto px-4 py-8 animate-in fade-in duration-500">
			<FloatingBubblesContainer
				data={(displayNames || []).map((n) => ({
					id: String(n.id),
					label: n.name,
					value: n.rating,
				}))}
			/>

			{!isCollapsed && (
				<div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
					<TournamentToolbar mode="tournament" filters={filterConfig || {}} className="w-full" />
				</div>
			)}

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
												data={(rankingHistory.data || []).map((d: any) => ({
													...d,
													rankings: (d.rankings || []).map((r: number | null) => r ?? 0),
												}))}
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
		<div className="w-full max-w-[1200px] mx-auto px-4 pb-20 pt-8" id="analysis">
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
