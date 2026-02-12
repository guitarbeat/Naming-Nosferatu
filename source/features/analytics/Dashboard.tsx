/**
 * @module Dashboard
 * @description Single unified dashboard component for the application.
 * Provides personal rankings, global analytics, and a random name generator.
 */

import { ButtonGroup, CardBody, Button as HeroButton, Spinner } from "@heroui/react";
import { Suspense, useCallback, useMemo, useState } from "react";
import type { NameItem } from "@/appTypes";
import { STORAGE_KEYS } from "@/constants";
import { useCollapsible } from "@/hooks/useBrowserState";
import { Card } from "@/layout/Card";
import { BumpChart } from "@/layout/Charts";
import { CollapsibleContent, CollapsibleHeader } from "@/layout/CollapsibleHeader";
import { EmptyState } from "@/layout/EmptyState";
import { FloatingBubblesContainer } from "@/layout/LayoutEffects";
import { clearAllCaches, devError } from "@/utils/basic";
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
import { CardBody, Button as HeroButton } from "@heroui/react";
import type { NameItem } from "@/appTypes";
import { usePersonalResults } from "@/features/analytics/hooks/usePersonalResults";
import { Download, Plus } from "@/icons";
import { Card } from "@/layout/Card";
import { useToast } from "@/Providers";
import { exportTournamentResultsToCSV } from "@/utils/basic";
import { RankingAdjustment } from "./RankingAdjustment";

interface PersonalResultsProps {
	personalRatings: Record<string, unknown> | undefined;
	currentTournamentNames?: NameItem[];
	onStartNew: () => void;
	onUpdateRatings: (
		ratings: Record<string, { rating: number; wins?: number; losses?: number }>,
	) => void;
	userName?: string;
}

export const PersonalResults = ({
	personalRatings,
	currentTournamentNames,
	onStartNew,
	onUpdateRatings,
}: PersonalResultsProps) => {
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
import {
	DragDropContext,
	Draggable,
	type DraggableProvided,
	type DraggableStateSnapshot,
	Droppable,
	type DroppableProvided,
	type DropResult,
} from "@hello-pangea/dnd";
import { Button, CardBody, CardHeader, Chip, cn, Divider } from "@heroui/react";
import { motion } from "framer-motion";
import { memo, useEffect, useRef, useState } from "react";
import type { NameItem } from "@/appTypes";
import { GripVertical, Loader2, Save } from "@/icons";
import { Card } from "@/layout/Card";
import { ErrorManager } from "@/services/errorManager";

function haveRankingsChanged(newItems: NameItem[], oldRankings: NameItem[]): boolean {
	if (newItems.length !== oldRankings.length) {
		return true;
	}
	return newItems.some(
		(item, index) =>
			item.name !== oldRankings[index]?.name || item.rating !== oldRankings[index]?.rating,
	);
}

const RankingItemContent = memo(({ item, index }: { item: NameItem; index: number }) => (
	<div className="flex items-center gap-4 w-full">
		{/* Drag Handle */}
		<div className="flex-shrink-0 text-white/40 hover:text-white/60 transition-colors cursor-grab active:cursor-grabbing">
			<GripVertical size={20} />
		</div>

		{/* Rank Badge */}
		<Chip
			className="flex-shrink-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-white font-bold min-w-[3rem]"
			size="lg"
			variant="flat"
		>
			#{index + 1}
		</Chip>

		{/* Name and Stats */}
		<div className="flex-1 min-w-0">
			<h3 className="text-lg font-semibold text-white truncate mb-1">{item.name}</h3>
			<div className="flex items-center gap-3 text-sm">
				<span className="text-white/60">
					Rating:{" "}
					<span className="text-white/90 font-medium">{Math.round(item.rating as number)}</span>
				</span>
			</div>
		</div>
	</div>
));
RankingItemContent.displayName = "RankingItemContent";

export const RankingAdjustment = memo(
	({
		rankings,
		onSave,
		onCancel,
	}: {
		rankings: NameItem[];
		onSave: (items: NameItem[]) => Promise<void>;
		onCancel: () => void;
	}) => {
		const [items, setItems] = useState(rankings || []);
		const [saveStatus, setSaveStatus] = useState("");
		const [isDragging, setIsDragging] = useState(false);
		const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
		const isMountedRef = useRef(true);
		const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

		useEffect(() => {
			if (hasUnsavedChanges) {
				return;
			}
			const sorted = [...rankings].sort((a, b) => (b.rating as number) - (a.rating as number));
			if (haveRankingsChanged(sorted, items)) {
				setItems(sorted);
			}
		}, [rankings, hasUnsavedChanges, items]);

		useEffect(() => {
			isMountedRef.current = true;
			if (items && rankings && haveRankingsChanged(items, rankings)) {
				setSaveStatus("saving");
				if (saveTimerRef.current) {
					clearTimeout(saveTimerRef.current);
				}
				saveTimerRef.current = setTimeout(() => {
					onSave(items)
						.then(() => {
							if (!isMountedRef.current) {
								return;
							}
							setHasUnsavedChanges(false);
							setSaveStatus("success");
							setTimeout(() => {
								if (isMountedRef.current) {
									setSaveStatus("");
								}
							}, 2000);
						})
						.catch((e: unknown) => {
							if (!isMountedRef.current) {
								return;
							}
							setSaveStatus("error");
							ErrorManager.handleError(e, "Save Rankings");
						});
				}, 1000);
			}
			return () => {
				if (saveTimerRef.current) {
					clearTimeout(saveTimerRef.current);
				}
			};
		}, [items, rankings, onSave]);

		const handleDragEnd = (result: DropResult) => {
			setIsDragging(false);
			if (!result.destination) {
				return;
			}
			const newItems = Array.from(items);
			const [reordered] = newItems.splice(result.source.index, 1);
			if (reordered) {
				newItems.splice(result.destination.index, 0, reordered);
			}
			const adjusted = newItems.map((item: NameItem, index: number) => ({
				...item,
				rating: Math.round(1000 + (1000 * (newItems.length - index)) / newItems.length),
			}));
			setHasUnsavedChanges(true);
			setItems(adjusted);
		};

		return (
			<Card
				className={cn("w-full max-w-4xl mx-auto", isDragging && "ring-2 ring-purple-500/50")}
				variant="primary"
			>
				<CardHeader className="flex flex-col gap-3 pb-4">
					<div className="flex items-center justify-between w-full">
						<h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
							Your Cat Name Rankings
						</h2>
						{saveStatus && (
							<Chip
								className={cn(
									"transition-all duration-300",
									saveStatus === "saving" &&
										"bg-blue-500/20 border-blue-500/30 text-blue-300 animate-pulse",
									saveStatus === "success" && "bg-green-500/20 border-green-500/30 text-green-300",
									saveStatus === "error" && "bg-red-500/20 border-red-500/30 text-red-300",
								)}
								variant="flat"
								startContent={
									saveStatus === "saving" ? (
										<Loader2 size={14} className="animate-spin" />
									) : saveStatus === "success" ? (
										<Save size={14} />
									) : null
								}
							>
								{saveStatus === "saving"
									? "Saving..."
									: saveStatus === "success"
										? "Saved!"
										: "Error saving"}
							</Chip>
						)}
					</div>
					<p className="text-white/60 text-sm">Drag and drop to reorder your favorite cat names</p>
				</CardHeader>

				<Divider className="bg-white/10" />

				<CardBody className="gap-3 p-6">
					<DragDropContext onDragStart={() => setIsDragging(true)} onDragEnd={handleDragEnd}>
						<Droppable droppableId="rankings">
							{(provided: DroppableProvided) => (
								<div
									{...provided.droppableProps}
									ref={provided.innerRef}
									className="flex flex-col gap-3"
								>
									{items.map((item: NameItem, index: number) => (
										<Draggable
											key={item.id || item.name}
											draggableId={String(item.id || item.name)}
											index={index}
										>
											{(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
												<div
													ref={provided.innerRef}
													{...provided.draggableProps}
													{...provided.dragHandleProps}
												>
													<motion.div
														initial={{ opacity: 0, y: 10 }}
														animate={{ opacity: 1, y: 0 }}
														exit={{ opacity: 0, scale: 0.95 }}
														className={cn(
															"p-4 rounded-xl transition-all duration-200",
															"bg-gradient-to-br from-white/5 to-white/[0.02]",
															"border border-white/10",
															"hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10",
															snapshot.isDragging &&
																"shadow-2xl shadow-purple-500/30 border-purple-500/50 scale-105 rotate-2",
														)}
													>
														<RankingItemContent item={item} index={index} />
													</motion.div>
												</div>
											)}
										</Draggable>
									))}
									{provided.placeholder}
								</div>
							)}
						</Droppable>
					</DragDropContext>
				</CardBody>

				<Divider className="bg-white/10" />

				<div className="p-6 flex justify-end">
					<Button
						onClick={onCancel}
						variant="flat"
						className="bg-white/5 hover:bg-white/10 text-white border border-white/10"
					>
						Back to Tournament
					</Button>
				</div>
			</Card>
		);
	},
);
RankingAdjustment.displayName = "RankingAdjustment";
