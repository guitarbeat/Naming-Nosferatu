import { DragDropContext, Draggable, Droppable, type DroppableProvided } from "@hello-pangea/dnd";
import { CardBody, CardHeader, Chip, Divider } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import {
	Activity,
	BarChart3,
	Check,
	ChevronDown,
	ChevronUp,
	Copy,
	Crown,
	Eye,
	EyeOff,
	Flame,
	GripVertical,
	LayoutDashboard,
	Loader2,
	Lock,
	Medal,
	Save,
	Shield,
	Star,
	Target,
	Trash2,
	TrendingUp,
	Trophy,
	Unlock,
	User,
	Users,
} from "lucide-react";
import type React from "react";
import type { ChangeEvent, ElementType, ReactNode } from "react";
import {
	cloneElement,
	isValidElement,
	memo,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Legend,
	PolarAngleAxis,
	PolarGrid,
	PolarRadiusAxis,
	Radar,
	RadarChart,
	ReferenceLine,
	Scatter,
	ScatterChart,
	Tooltip,
	XAxis,
	YAxis,
	ZAxis,
} from "recharts";
import type {
	EngagementMetrics,
	LeaderboardItem,
	SiteStats,
	UserStats,
} from "@/shared/api/mock/statsService";
import { statsAPI } from "@/shared/api/mock/statsService";
import { namesQueryOptions, useNameAdminActions } from "@/shared/api/names/api";
import { Button, Card, EmptyState, Loading } from "@/shared/components/LayoutBlocks";
import { SearchFilterBar } from "@/shared/components/UIBlocks";
import {
	getActiveNames,
	getHiddenNames,
	getLockedNames,
	isNameHidden,
	isNameLocked,
	matchesNameSearchTerm,
} from "@/shared/lib/names";
import { computeRatingStats } from "@/shared/lib/ratingStats";
import { MOTION_DURATIONS, MOTION_EASING, themeSurfaces, themeText } from "@/shared/lib/uiUtils";
import { cn } from "@/shared/lib/utils";
import { ErrorManager } from "@/shared/services/errorManager";
import type { NameItem, RatingData } from "@/shared/types";
import useAppStore from "@/store";
import { type DashboardTimeframe, useDashboardData } from "./hooks/useDashboardData";

export const CHART_PALETTE = {
	teal: "#3FB8B0",
	coral: "#E5764A",
	sand: "#D4B483",
	violet: "#9F7AEA",
	sky: "#5BA8E8",
	rose: "#E26E9D",
} as const;

export const CHART_SERIES = [
	CHART_PALETTE.teal,
	CHART_PALETTE.coral,
	CHART_PALETTE.sand,
	CHART_PALETTE.violet,
	CHART_PALETTE.sky,
	CHART_PALETTE.rose,
] as const;

export const CHART_TEXT_MUTED = "rgba(200, 210, 222, 0.55)";
export const CHART_GRID = "rgba(200, 210, 222, 0.12)";
export const CHART_AXIS = "rgba(200, 210, 222, 0.18)";
export const CHART_FOREGROUND = "#ebf1f7";

export const CHART_TOOLTIP_STYLE = {
	background: "var(--chart-tooltip-bg)",
	border: "1px solid var(--chart-tooltip-border)",
	borderRadius: 10,
	fontSize: 12,
	color: "var(--chart-tooltip-fg)",
	boxShadow: "var(--chart-tooltip-shadow)",
} as const;

export const CHART_CURSOR = { fill: "var(--chart-cursor-fill)" } as const;

// ============================================================================
// CORE CONTAINERS & DECORATIONS
// ============================================================================

export function ChartFrame({
	children,
	variant = "default",
}: {
	children: ReactNode;
	variant?: "default" | "tall";
}) {
	const frameRef = useRef<HTMLDivElement>(null);
	const [size, setSize] = useState({ width: 0, height: 0 });

	useEffect(() => {
		const element = frameRef.current;
		if (!element) {
			return;
		}

		const updateSize = () => {
			const { width, height } = element.getBoundingClientRect();
			setSize({
				width: Math.max(0, Math.floor(width)),
				height: Math.max(0, Math.floor(height)),
			});
		};

		updateSize();
		const observer = new ResizeObserver(updateSize);
		observer.observe(element);

		return () => observer.disconnect();
	}, []);

	const chart =
		size.width > 0 && size.height > 0 && isValidElement(children)
			? cloneElement(children as React.ReactElement<{ width?: number; height?: number }>, {
					width: size.width,
					height: size.height,
				})
			: null;

	return (
		<div ref={frameRef} className={`chart-frame ${variant === "tall" ? "chart-frame--tall" : ""}`}>
			{chart}
		</div>
	);
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
	return (
		<Card variant="default" shadow="large" className={className}>
			{children}
		</Card>
	);
}

export function ListPanel({ children, className }: { children: ReactNode; className?: string }) {
	return <div className={cn(themeSurfaces.panelInset, className)}>{children}</div>;
}

export function ListPanelRow({
	children,
	divided = true,
	className,
}: {
	children: ReactNode;
	divided?: boolean;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex items-center gap-3 px-4 py-3",
				divided && themeSurfaces.rowDivider,
				className,
			)}
		>
			{children}
		</div>
	);
}

export function StatTile({
	label,
	value,
	icon: Icon,
	accent = false,
}: {
	label: string;
	value: string | number;
	icon?: ElementType;
	accent?: boolean;
}) {
	return (
		<div className="group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-4 transition-all hover:border-primary/30 hover:shadow-md">
			<div className="absolute -top-6 -right-6 size-12 rounded-full bg-primary/5 blur-xl transition-transform group-hover:scale-110" />
			<div className="relative space-y-2">
				<div className="flex items-center justify-between">
					<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						{label}
					</p>
					{Icon && (
						<div
							className={cn(
								"rounded-lg p-2 transition-colors",
								accent ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground",
							)}
						>
							<Icon size={14} />
						</div>
					)}
				</div>
				<p className={cn("text-2xl font-bold tracking-tight", accent && "text-primary")}>{value}</p>
			</div>
		</div>
	);
}

export function ContextBadge({
	label,
	tone = "default",
}: {
	label: string;
	tone?: "default" | "accent";
}) {
	return (
		<span className={tone === "accent" ? themeSurfaces.badgeAccent : themeSurfaces.badge}>
			{label}
		</span>
	);
}

export function SectionHeader({
	icon: Icon,
	title,
	subtitle,
	action,
}: {
	icon: ElementType;
	title: string;
	subtitle?: string;
	action?: ReactNode;
}) {
	return (
		<div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
			<div className="space-y-1.5">
				<div className="flex items-center gap-2">
					<Icon size={13} className="text-primary/70 shrink-0" />
					<span className={themeText.sectionLabel}>{title}</span>
				</div>
				{subtitle ? <p className={cn("max-w-2xl", themeText.subtitle)}>{subtitle}</p> : null}
			</div>
			{action}
		</div>
	);
}

// ============================================================================
// CHARTS & STATS VISUALIZATIONS
// ============================================================================

interface LeaderboardEntry {
	name: string;
	total_ratings: number;
	wins: number;
	avg_rating: number;
	losses?: number;
	percentile_rank?: number;
}

export const TopNamesChart = memo(function TopNamesChart({
	leaderboard,
	limit = 8,
}: {
	leaderboard: LeaderboardEntry[];
	limit?: number;
}) {
	const { data, allRatings } = useMemo(() => {
		// ⚡ Bolt Optimization: Replaced .reduce() and array .push() with a single-pass
		// for loop and pre-allocated arrays to eliminate dynamic reallocation and GC overhead.
		const len = leaderboard.length;
		const effectiveLimit = limit ?? len;
		const dataLen = Math.min(len, effectiveLimit);
		const allRatings = new Array<number>(len);
		const data = new Array<{
			name: string;
			rating: number;
			fullName: string;
			percentile: number | null;
		}>(dataLen);

		for (let i = 0; i < len; i++) {
			const e = leaderboard[i];
			allRatings[i] = e.avg_rating;

			if (i < effectiveLimit) {
				data[i] = {
					name: e.name.length > 10 ? `${e.name.slice(0, 9)}…` : e.name,
					rating: Math.round(e.avg_rating),
					fullName: e.name,
					percentile: e.percentile_rank ?? null,
				};
			}
		}

		return { data, allRatings };
	}, [leaderboard, limit]);

	if (data.length === 0) {
		return null;
	}
	const stats = computeRatingStats(allRatings);
	const meanRating = stats ? Math.round(stats.mean) : null;

	return (
		<ChartFrame>
			<BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 4, bottom: 8 }}>
				<CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} horizontal={false} />
				<XAxis
					type="number"
					tick={{ fontSize: 10, fill: CHART_TEXT_MUTED }}
					axisLine={false}
					tickLine={false}
					domain={["dataMin - 50", "dataMax + 20"]}
				/>
				<YAxis
					dataKey="name"
					type="category"
					width={72}
					tick={{ fontSize: 11, fill: CHART_FOREGROUND, fontWeight: 500 }}
					axisLine={false}
					tickLine={false}
				/>
				<Tooltip
					contentStyle={CHART_TOOLTIP_STYLE}
					formatter={(
						value: number | string,
						_: unknown,
						item?: {
							payload?: { fullName?: string; percentile?: number | null };
						},
					) => {
						const label = item?.payload?.fullName ?? "";
						const pct = item?.payload?.percentile ?? null;
						return [`${value}${pct === null ? "" : ` (top ${100 - pct}%)`}`, label];
					}}
					cursor={CHART_CURSOR}
				/>
				<Bar dataKey="rating" radius={[0, 8, 8, 0]} maxBarSize={28}>
					{data.map((_, i) => (
						<Cell key={data[i].name} fill={CHART_SERIES[i % CHART_SERIES.length]} />
					))}
				</Bar>
				{meanRating !== null && (
					<ReferenceLine
						x={meanRating}
						stroke={CHART_AXIS}
						strokeDasharray="4 3"
						strokeWidth={2}
						label={{
							value: `avg ${meanRating}`,
							position: "insideBottomRight",
							fill: CHART_TEXT_MUTED,
							fontSize: 10,
							fontWeight: 500,
							offset: 8,
						}}
					/>
				)}
			</BarChart>
		</ChartFrame>
	);
});

export const WinLossChart = memo(function WinLossChart({
	leaderboard,
	limit = 8,
}: {
	leaderboard: LeaderboardEntry[];
	limit?: number;
}) {
	const data = useMemo(() => {
		const result: Array<{ name: string; wins: number; losses: number }> = [];
		if (limit > 0) {
			for (let i = 0; i < leaderboard.length; i++) {
				const e = leaderboard[i];
				const wins = e.wins ?? 0;
				const losses = e.losses ?? 0;
				if (wins + losses > 0) {
					result.push({
						name: e.name.length > 8 ? `${e.name.slice(0, 7)}…` : e.name,
						wins,
						losses,
					});
					if (result.length >= limit) {
						break;
					}
				}
			}
		}
		return result;
	}, [leaderboard, limit]);

	if (data.length === 0) {
		return (
			<div
				className={cn(
					themeSurfaces.panelInset,
					"flex h-40 items-center justify-center rounded-2xl border border-dashed px-4 text-center text-sm text-muted-foreground",
				)}
			>
				No head-to-head matches recorded yet. Run a tournament to populate this chart.
			</div>
		);
	}

	return (
		<ChartFrame>
			<BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
				<CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
				<XAxis
					dataKey="name"
					tick={{ fontSize: 10, fill: CHART_TEXT_MUTED }}
					axisLine={{ stroke: CHART_GRID }}
					tickLine={false}
				/>
				<YAxis
					allowDecimals={false}
					tick={{ fontSize: 10, fill: CHART_TEXT_MUTED }}
					axisLine={false}
					tickLine={false}
				/>
				<Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={CHART_CURSOR} />
				<Legend wrapperStyle={{ fontSize: 11, color: CHART_TEXT_MUTED }} />
				<Bar
					dataKey="wins"
					stackId="a"
					fill={CHART_PALETTE.teal}
					radius={[0, 0, 0, 0]}
					maxBarSize={32}
				/>
				<Bar
					dataKey="losses"
					stackId="a"
					fill={CHART_PALETTE.coral}
					fillOpacity={0.75}
					radius={[4, 4, 0, 0]}
					maxBarSize={32}
				/>
			</BarChart>
		</ChartFrame>
	);
});

const BUCKET_SIZE = 25;

function bucketLabel(bucketStart: number) {
	return `${bucketStart}–${bucketStart + BUCKET_SIZE}`;
}

export const RatingDistributionChart = memo(function RatingDistributionChart({
	leaderboard,
}: {
	leaderboard: LeaderboardEntry[];
}) {
	const ratings = useMemo(() => {
		const result: number[] = [];
		for (let i = 0; i < leaderboard.length; i++) {
			const e = leaderboard[i];
			if ((e.total_ratings ?? 0) > 0) {
				result.push(Math.round(e.avg_rating));
			}
		}
		return result;
	}, [leaderboard]);

	const stats = useMemo(() => computeRatingStats(ratings), [ratings]);

	const data = useMemo(() => {
		if (ratings.length === 0) {
			return [];
		}

		let minRating = Number.POSITIVE_INFINITY;
		let maxRating = Number.NEGATIVE_INFINITY;
		for (const r of ratings) {
			if (r < minRating) {
				minRating = r;
			}
			if (r > maxRating) {
				maxRating = r;
			}
		}

		const minBucket = Math.floor(minRating / BUCKET_SIZE) * BUCKET_SIZE;
		const maxBucket = Math.ceil(maxRating / BUCKET_SIZE) * BUCKET_SIZE;

		const buckets: Record<number, number> = {};
		for (let b = minBucket; b <= maxBucket; b += BUCKET_SIZE) {
			buckets[b] = 0;
		}
		for (const r of ratings) {
			const bucket = Math.floor(r / BUCKET_SIZE) * BUCKET_SIZE;
			buckets[bucket] = (buckets[bucket] ?? 0) + 1;
		}

		const chartData = [];
		for (const keyStr in buckets) {
			const keyNum = Number(keyStr);
			chartData.push({
				range: bucketLabel(keyNum),
				bucketStart: keyNum,
				count: buckets[keyNum],
			});
		}
		return chartData.sort((a, b) => a.bucketStart - b.bucketStart);
	}, [ratings]);

	const meanBucket = useMemo(() => {
		if (!stats) {
			return null;
		}
		return Math.floor(stats.mean / BUCKET_SIZE) * BUCKET_SIZE;
	}, [stats]);

	const stdDevBuckets = useMemo(() => {
		if (!stats || stats.stdDev <= 0) {
			return null;
		}
		const lo = Math.floor((stats.mean - stats.stdDev) / BUCKET_SIZE) * BUCKET_SIZE;
		const hi = Math.floor((stats.mean + stats.stdDev) / BUCKET_SIZE) * BUCKET_SIZE;
		return { lo: bucketLabel(lo), hi: bucketLabel(hi) };
	}, [stats]);

	if (data.length === 0) {
		return (
			<div
				className={cn(
					themeSurfaces.panelInset,
					"flex h-40 items-center justify-center rounded-2xl border border-dashed px-4 text-center text-sm text-muted-foreground",
				)}
			>
				Not enough rated names yet to draw a distribution.
			</div>
		);
	}

	const meanRange = meanBucket === null ? null : bucketLabel(meanBucket);

	let maxCount = 0;
	for (let i = 0; i < data.length; i++) {
		if (data[i].count > maxCount) {
			maxCount = data[i].count;
		}
	}

	return (
		<div className="space-y-3">
			<ChartFrame>
				<BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
					<CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
					<XAxis
						dataKey="range"
						tick={{ fontSize: 10, fill: CHART_TEXT_MUTED }}
						axisLine={{ stroke: CHART_GRID }}
						tickLine={false}
					/>
					<YAxis
						allowDecimals={false}
						tick={{ fontSize: 10, fill: CHART_TEXT_MUTED }}
						axisLine={false}
						tickLine={false}
					/>
					<Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={CHART_CURSOR} />
					<Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40}>
						{data.map((d) => (
							<Cell
								key={d.bucketStart}
								fill={CHART_PALETTE.teal}
								fillOpacity={0.45 + (d.count / maxCount) * 0.55}
							/>
						))}
					</Bar>
					{meanRange && (
						<ReferenceLine
							x={meanRange}
							stroke={CHART_PALETTE.coral}
							strokeDasharray="4 3"
							strokeWidth={2}
							label={{
								value: "μ",
								position: "top",
								fill: CHART_PALETTE.coral,
								fontSize: 11,
								fontWeight: 700,
							}}
						/>
					)}
					{stdDevBuckets && (
						<>
							<ReferenceLine
								x={stdDevBuckets.lo}
								stroke={CHART_TEXT_MUTED}
								strokeDasharray="2 4"
								strokeWidth={1}
								label={{
									value: "−σ",
									position: "top",
									fill: CHART_TEXT_MUTED,
									fontSize: 9,
								}}
							/>
							<ReferenceLine
								x={stdDevBuckets.hi}
								stroke={CHART_TEXT_MUTED}
								strokeDasharray="2 4"
								strokeWidth={1}
								label={{
									value: "+σ",
									position: "top",
									fill: CHART_TEXT_MUTED,
									fontSize: 9,
								}}
							/>
						</>
					)}
				</BarChart>
			</ChartFrame>

			{stats && (
				<div className="grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
					<div className="rounded-lg bg-card/40 px-2 py-1.5">
						<div className="font-semibold text-foreground">{Math.round(stats.mean)}</div>
						<div>Mean (μ)</div>
					</div>
					<div className="rounded-lg bg-card/40 px-2 py-1.5">
						<div className="font-semibold text-foreground">{Math.round(stats.median)}</div>
						<div>Median</div>
					</div>
					<div className="rounded-lg bg-card/40 px-2 py-1.5">
						<div className="font-semibold text-foreground">±{Math.round(stats.stdDev)}</div>
						<div>Std Dev (σ)</div>
					</div>
				</div>
			)}
		</div>
	);
});

export const RatingRadarChart = memo(function RatingRadarChart({
	leaderboard,
	limit = 6,
}: {
	leaderboard: LeaderboardEntry[];
	limit?: number;
}) {
	const { data, showChart } = useMemo(() => {
		const top: LeaderboardEntry[] = [];
		let maxRating = -Infinity;
		let maxWins = -Infinity;
		let maxTotal = -Infinity;

		if (limit > 0) {
			for (let i = 0; i < leaderboard.length; i++) {
				if (top.length >= limit) {
					break;
				}
				const e = leaderboard[i];
				if ((e.total_ratings ?? 0) > 0) {
					top.push(e);
					if (e.avg_rating > maxRating) {
						maxRating = e.avg_rating;
					}
					if (e.wins > maxWins) {
						maxWins = e.wins;
					}
					if (e.total_ratings > maxTotal) {
						maxTotal = e.total_ratings;
					}
				}
			}
		}

		if (top.length < 3) {
			return { data: [], showChart: false };
		}

		maxRating = maxRating === -Infinity ? 1 : maxRating || 1;
		maxWins = maxWins === -Infinity ? 1 : maxWins || 1;
		maxTotal = maxTotal === -Infinity ? 1 : maxTotal || 1;

		const chartData = new Array(top.length);
		for (let i = 0; i < top.length; i++) {
			const e = top[i];
			chartData[i] = {
				name: e.name.length > 10 ? `${e.name.slice(0, 9)}…` : e.name,
				rating: Math.round((e.avg_rating / maxRating) * 100),
				wins: Math.round((e.wins / maxWins) * 100),
				activity: Math.round((e.total_ratings / maxTotal) * 100),
			};
		}

		return { data: chartData, showChart: true };
	}, [leaderboard, limit]);

	if (!showChart) {
		return null;
	}

	return (
		<ChartFrame variant="tall">
			<RadarChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
				<PolarGrid stroke={CHART_GRID} />
				<PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: CHART_TEXT_MUTED }} />
				<PolarRadiusAxis
					angle={30}
					domain={[0, 100]}
					tick={{ fontSize: 9, fill: CHART_TEXT_MUTED }}
					axisLine={false}
				/>
				<Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
				<Radar
					name="Rating"
					dataKey="rating"
					stroke={CHART_PALETTE.teal}
					fill={CHART_PALETTE.teal}
					fillOpacity={0.2}
					strokeWidth={2}
				/>
				<Radar
					name="Wins"
					dataKey="wins"
					stroke={CHART_PALETTE.coral}
					fill={CHART_PALETTE.coral}
					fillOpacity={0.18}
					strokeWidth={2}
				/>
				<Radar
					name="Activity"
					dataKey="activity"
					stroke={CHART_PALETTE.violet}
					fill={CHART_PALETTE.violet}
					fillOpacity={0.12}
					strokeWidth={1.5}
					strokeDasharray="4 2"
				/>
			</RadarChart>
		</ChartFrame>
	);
});

function RankChip({ rank }: { rank: number }) {
	if (rank === 1) {
		return (
			<div
				className="flex size-8 items-center justify-center rounded-lg border border-amber-500/40 bg-amber-500/15 font-mono text-xs font-black text-amber-300 shadow-xs"
				title="Rank 1: Champion"
			>
				<Medal className="size-4" />
			</div>
		);
	}
	if (rank === 2) {
		return (
			<div
				className="flex size-8 items-center justify-center rounded-lg border border-slate-300/30 bg-slate-300/10 font-mono text-xs font-black text-slate-200 shadow-xs"
				title="Rank 2: Runner-up"
			>
				<Medal className="size-4" />
			</div>
		);
	}
	if (rank === 3) {
		return (
			<div
				className="flex size-8 items-center justify-center rounded-lg border border-amber-700/30 bg-amber-700/15 font-mono text-xs font-black text-amber-500 shadow-xs"
				title="Rank 3: Third Place"
			>
				<Medal className="size-4" />
			</div>
		);
	}

	return (
		<div className="flex size-8 items-center justify-center rounded-lg border border-border/40 bg-secondary/30 font-mono text-xs font-bold text-muted-foreground">
			{rank}
		</div>
	);
}

export const LeaderboardPanel = memo(function LeaderboardPanel({
	leaderboard,
	isLoadingLeaderboard,
	onStartNew,
}: {
	leaderboard: LeaderboardEntry[];
	isLoadingLeaderboard: boolean;
	onStartNew?: () => void;
}) {
	return (
		<Panel>
			<SectionHeader
				icon={Trophy}
				title="Leaderboard"
				subtitle="Top contenders across all tournament matchups."
				action={
					<div className="flex items-center gap-2">
						<ContextBadge label="Community" />
						{onStartNew && (
							<Button variant="outline" size="small" onClick={onStartNew}>
								New Tournament
							</Button>
						)}
					</div>
				}
			/>

			{isLoadingLeaderboard ? (
				<Loading variant="skeleton" height={320} />
			) : leaderboard.length > 0 ? (
				<ListPanel>
					{leaderboard.map((entry, index) => {
						const rank = index + 1;
						return (
							<ListPanelRow
								key={entry.name}
								divided={index < leaderboard.length - 1}
								className="group transition-colors hover:bg-muted/30"
							>
								<RankChip rank={rank} />

								<div className="min-w-0 flex-1">
									<p className="truncate font-display text-sm font-bold text-foreground group-hover:text-primary transition-colors">
										{entry.name}
									</p>
									<div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
										<span className="inline-flex items-center gap-1">
											<Star className="size-3 text-muted-foreground" />
											<span className="font-mono tabular-nums">{entry.total_ratings}</span> rating
											{entry.total_ratings === 1 ? "" : "s"}
										</span>
										<span className="inline-flex items-center gap-1">
											<Flame className="size-3 text-accent" />
											<span className="font-mono tabular-nums">{entry.wins}</span> win
											{entry.wins === 1 ? "" : "s"}
										</span>
									</div>
								</div>

								<div className="text-right flex flex-col items-end">
									<div className="inline-flex items-center justify-center rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-0.5 font-mono text-sm font-bold text-primary tabular-nums shadow-2xs">
										{Math.round(entry.avg_rating)}
									</div>
									<span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
										Rating
									</span>
								</div>
							</ListPanelRow>
						);
					})}
				</ListPanel>
			) : (
				<EmptyState
					title="No community ratings yet"
					description="Complete tournament battles to rank contenders and establish the community leaderboard."
				/>
			)}
		</Panel>
	);
});

function haveRankingsChanged(newItems: NameItem[], oldRankings: NameItem[]): boolean {
	if (newItems === oldRankings) {
		return false;
	}
	const len = newItems.length;
	if (len !== oldRankings.length) {
		return true;
	}
	// ⚡ Bolt Optimization: Replace `.some()` with standard `for` loop + reference equality check.
	// Avoids callback execution overhead and short-circuits instantly if objects are the same reference.
	for (let i = 0; i < len; i++) {
		const newItem = newItems[i] as NameItem;
		const oldItem = oldRankings[i] as NameItem;
		if (newItem === oldItem) {
			continue;
		}
		if (!oldItem || newItem.name !== oldItem.name || newItem.rating !== oldItem.rating) {
			return true;
		}
	}
	return false;
}

interface RankingItemContentProps {
	item: NameItem;
	index: number;
	totalItems: number;
	onMoveUp?: () => void;
	onMoveDown?: () => void;
}

const RankingItemContent = memo(
	({ item, index, totalItems, onMoveUp, onMoveDown }: RankingItemContentProps) => {
		const medalColors = {
			0: "from-yellow-500 to-amber-600",
			1: "from-slate-300 to-slate-500",
			2: "from-amber-700 to-orange-800",
		};
		const medalBg =
			index < 3 ? medalColors[index as keyof typeof medalColors] : "from-primary/20 to-accent/20";
		const medalBorder = index < 3 ? "border-yellow-600/50" : "border-primary/30";
		const medalText = index < 3 ? "text-white" : "text-foreground";

		const winRate =
			item.wins || item.losses
				? Math.round(((item.wins || 0) / ((item.wins || 0) + (item.losses || 0))) * 100)
				: null;

		return (
			<div className="flex items-center gap-3 sm:gap-4 w-full">
				{/* Drag Handle */}
				<div
					className="flex-shrink-0 text-muted-foreground hover:text-muted-foreground transition-colors cursor-grab active:cursor-grabbing p-1 rounded-md"
					title="Drag to reorder"
				>
					<GripVertical size={18} />
				</div>

				{/* Rank Badge */}
				<Chip
					className={`flex-shrink-0 bg-gradient-to-br ${medalBg} border ${medalBorder} ${medalText} font-bold min-w-[2.75rem] shadow-sm`}
					size="lg"
					variant="flat"
				>
					{index < 3 ? ["🥇", "🥈", "🥉"][index] : `#${index + 1}`}
				</Chip>

				{/* Name and Stats */}
				<div className="flex-1 min-w-0">
					<h3 className="text-base sm:text-lg font-bold text-foreground truncate">{item.name}</h3>
					<div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm mt-0.5">
						<div className="flex items-center gap-1">
							<span className="text-muted-foreground text-[11px]">Score:</span>
							<span className="inline-flex items-center justify-center rounded-md bg-primary/15 px-1.5 py-0.5 font-bold text-primary tabular-nums">
								{Math.round(item.rating as number)}
							</span>
						</div>
						{item.wins !== undefined && item.losses !== undefined && (
							<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
								<span className="text-accent font-semibold">{item.wins}W</span>
								<span>-</span>
								<span className="text-destructive/80 font-semibold">{item.losses}L</span>
								{winRate !== null && (
									<span className="hidden sm:inline-block text-[11px] text-muted-foreground tabular-nums">
										({winRate}%)
									</span>
								)}
							</div>
						)}
					</div>
				</div>

				{/* Accessible Nudge Buttons */}
				{(onMoveUp || onMoveDown) && (
					<div className="flex items-center gap-1 shrink-0">
						<button
							type="button"
							onClick={onMoveUp}
							disabled={index === 0}
							className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/5 disabled:opacity-20 disabled:pointer-events-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer disabled:cursor-not-allowed"
							aria-label={`Move ${item.name} up`}
							title="Move up"
						>
							<ChevronUp size={16} />
						</button>
						<button
							type="button"
							onClick={onMoveDown}
							disabled={index === totalItems - 1}
							className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/5 disabled:opacity-20 disabled:pointer-events-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer disabled:cursor-not-allowed"
							aria-label={`Move ${item.name} down`}
							title="Move down"
						>
							<ChevronDown size={16} />
						</button>
					</div>
				)}
			</div>
		);
	},
);
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
		const saveStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
		const onSaveRef = useRef(onSave);

		useEffect(() => {
			onSaveRef.current = onSave;
		}, [onSave]);

		useEffect(() => {
			isMountedRef.current = true;

			return () => {
				isMountedRef.current = false;
				if (saveTimerRef.current) {
					clearTimeout(saveTimerRef.current);
					saveTimerRef.current = null;
				}
				if (saveStatusTimerRef.current) {
					clearTimeout(saveStatusTimerRef.current);
					saveStatusTimerRef.current = null;
				}
			};
		}, []);

		useEffect(() => {
			if (hasUnsavedChanges) {
				return;
			}
			if (!haveRankingsChanged(rankings, items)) {
				return;
			}
			const sorted = [...rankings].sort((a, b) => (b.rating as number) - (a.rating as number));
			if (haveRankingsChanged(sorted, items)) {
				setItems(sorted);
			}
		}, [rankings, hasUnsavedChanges, items]);

		useEffect(() => {
			if (!hasUnsavedChanges) {
				return;
			}
			if (items && rankings && haveRankingsChanged(items, rankings)) {
				setSaveStatus("saving");
				if (saveTimerRef.current) {
					clearTimeout(saveTimerRef.current);
					saveTimerRef.current = null;
				}
				if (saveStatusTimerRef.current) {
					clearTimeout(saveStatusTimerRef.current);
					saveStatusTimerRef.current = null;
				}
				saveTimerRef.current = setTimeout(() => {
					onSaveRef
						.current(items)
						.then(() => {
							if (!isMountedRef.current) {
								return;
							}
							setHasUnsavedChanges(false);
							setSaveStatus("success");
							saveStatusTimerRef.current = setTimeout(() => {
								if (isMountedRef.current) {
									setSaveStatus("");
								}
								saveStatusTimerRef.current = null;
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
					saveTimerRef.current = null;
				}
				if (saveStatusTimerRef.current) {
					clearTimeout(saveStatusTimerRef.current);
					saveStatusTimerRef.current = null;
				}
			};
		}, [items, rankings, hasUnsavedChanges]);

		const handleReorder = (newItems: NameItem[]) => {
			const len = newItems.length;
			const adjusted = new Array(len);
			for (let i = 0; i < len; i++) {
				adjusted[i] = {
					...(newItems[i] as NameItem),
					rating: Math.round(1000 + (1000 * (len - i)) / len),
				};
			}
			setHasUnsavedChanges(true);
			setItems(adjusted);
		};

		const handleMove = (index: number, direction: "up" | "down") => {
			const targetIndex = direction === "up" ? index - 1 : index + 1;
			if (targetIndex < 0 || targetIndex >= items.length) {
				return;
			}
			const newItems = Array.from(items);
			const [moved] = newItems.splice(index, 1);
			if (moved) {
				newItems.splice(targetIndex, 0, moved);
			}
			handleReorder(newItems);
		};

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
			handleReorder(newItems);
		};

		return (
			<div className={cn("w-full max-w-4xl mx-auto", isDragging && "ring-2 ring-primary/50")}>
				<CardHeader className="flex flex-col gap-3 pb-4">
					<div className="flex items-center justify-between w-full">
						<h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
							Your Cat Name Rankings
						</h2>
						{saveStatus && (
							<Chip
								className={cn(
									"transition-all duration-300",
									saveStatus === "saving" &&
										"bg-chart-5/20 border-chart-5/30 text-chart-5 animate-pulse",
									saveStatus === "success" && "bg-chart-2/20 border-chart-2/30 text-chart-2",
									saveStatus === "error" &&
										"bg-destructive/20 border-destructive/30 text-destructive",
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
					<p className="text-muted-foreground text-sm">
						Drag and drop or use arrow buttons to reorder your favorite cat names
					</p>
				</CardHeader>

				<Divider className="bg-border/10" />

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
															"py-3 px-2 rounded-xl transition-all duration-200 border border-border/10 hover:border-border/30 bg-card/40",
															snapshot.isDragging && "bg-foreground/5 scale-105 rotate-1 shadow-lg",
														)}
													>
														<RankingItemContent
															item={item}
															index={index}
															totalItems={items.length}
															onMoveUp={() => handleMove(index, "up")}
															onMoveDown={() => handleMove(index, "down")}
														/>
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

				<Divider className="bg-border/10" />

				<div className="p-6 flex justify-end">
					<Button
						onClick={onCancel}
						variant="flat"
						className="bg-foreground/5 hover:bg-foreground/10 text-foreground border border-border/10 transition-all duration-300"
					>
						Back to Tournament
					</Button>
				</div>
			</div>
		);
	},
);
RankingAdjustment.displayName = "RankingAdjustment";

// ============================================================================
// DASHBOARD HEADER & QUICK STATS
// ============================================================================

export interface QuickStat {
	accent?: boolean;
	icon: ElementType;
	label: string;
	value: string | number;
}

export function getQuickStats({
	siteStats,
	userName,
	userStats,
}: {
	siteStats: SiteStats | null;
	userName: string;
	userStats: UserStats | null;
}): QuickStat[] {
	if (userName && userStats) {
		return [
			{ label: "Ratings", value: userStats.totalRatings, icon: BarChart3 },
			{ label: "Selected", value: userStats.totalSelections, icon: Target },
			{
				label: "Wins",
				value: userStats.totalWins,
				icon: Trophy,
				accent: true,
			},
			{
				label: "Win rate",
				value: `${userStats.winRate}%`,
				icon: TrendingUp,
				accent: true,
			},
		];
	}

	if (siteStats) {
		return [
			{
				label: "Total names",
				value: siteStats.totalNames,
				icon: Activity,
			},
			{
				label: "Active names",
				value: siteStats.activeNames,
				icon: Target,
			},
			{ label: "Users", value: siteStats.totalUsers, icon: Users },
			{
				label: "Average rating",
				value: Math.round(siteStats.avgRating),
				icon: TrendingUp,
				accent: true,
			},
		];
	}

	return [];
}

const DashboardHeader = memo(function DashboardHeader({
	isLoggedIn,
	userName,
	avatarUrl,
	isAdmin,
	quickStats,
	userStats,
}: {
	isLoggedIn: boolean;
	userName: string;
	avatarUrl?: string;
	isAdmin: boolean;
	quickStats: QuickStat[];
	userStats: UserStats | null;
}) {
	if (!isLoggedIn && quickStats.length === 0) {
		return null;
	}

	return (
		<div className="grid gap-4 xl:grid-cols-[minmax(0,20rem)_1fr]">
			{isLoggedIn && userName && (
				<Panel>
					<div className="flex items-center gap-4">
						<div className="relative">
							{avatarUrl ? (
								<img
									src={avatarUrl}
									alt={userName}
									className={`size-16 rounded-full object-cover ring-2 ring-primary/20 ${themeSurfaces.avatar}`}
								/>
							) : (
								<div
									className={`flex size-16 items-center justify-center rounded-full ring-2 ring-primary/20 text-primary ${themeSurfaces.avatar}`}
								>
									<User size={22} />
								</div>
							)}
							{isAdmin && (
								<div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 p-1">
									<div className="rounded-full bg-card p-0.5">
										<span className="text-xs font-bold">👑</span>
									</div>
								</div>
							)}
						</div>
						<div className="min-w-0">
							<p className={themeText.eyebrowWide}>Profile</p>
							<h2 className="mt-2 truncate text-2xl font-semibold text-foreground">{userName}</h2>
							<p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
								<span>{isAdmin ? "👤 Administrator" : "🎮 Tournament participant"}</span>
							</p>
						</div>
					</div>
				</Panel>
			)}

			{quickStats.length > 0 && (
				<Panel>
					<SectionHeader
						icon={BarChart3}
						title={userStats ? "Your Snapshot" : "Community Snapshot"}
						subtitle={userStats ? "Your totals." : "Pool totals."}
					/>
					<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
						{quickStats.map((item) => (
							<StatTile
								key={item.label}
								label={item.label}
								value={item.value}
								icon={item.icon}
								accent={Boolean(item.accent)}
							/>
						))}
					</div>
				</Panel>
			)}
		</div>
	);
});

// ============================================================================
// ENGAGEMENT PANEL
// ============================================================================

const TIMEFRAME_OPTIONS = [
	{ value: "day" as const, label: "24h" },
	{ value: "week" as const, label: "Week" },
	{ value: "month" as const, label: "Month" },
] as const;

const EngagementPanel = memo(function EngagementPanel({
	engagementMetrics,
	timeframe,
	setTimeframe,
	refreshEngagementMetrics,
	isLoadingEngagement,
}: {
	engagementMetrics: EngagementMetrics | null;
	timeframe: DashboardTimeframe;
	setTimeframe: (tf: DashboardTimeframe) => void;
	refreshEngagementMetrics: () => void;
	isLoadingEngagement: boolean;
}) {
	const prefersReducedMotion = useReducedMotion();

	if (!engagementMetrics) {
		return null;
	}

	return (
		<Panel>
			<SectionHeader
				icon={TrendingUp}
				title="Recent Activity"
				subtitle="Last window."
				action={
					<motion.div
						className="flex items-center gap-3"
						initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
						animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
						transition={{
							duration: MOTION_DURATIONS.base,
							ease: MOTION_EASING.easeStandard,
						}}
					>
						<div className="flex bg-black/20 rounded-lg p-1">
							{TIMEFRAME_OPTIONS.map((opt) => (
								<button
									key={opt.value}
									type="button"
									onClick={() => setTimeframe(opt.value)}
									className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
										timeframe === opt.value
											? "bg-primary/20 text-primary shadow-sm"
											: "text-muted-foreground hover:text-foreground"
									}`}
								>
									{opt.label}
								</button>
							))}
						</div>
						<Button
							variant="outline"
							size="small"
							onClick={() => refreshEngagementMetrics()}
							disabled={isLoadingEngagement}
						>
							<Activity size={14} />
							Refresh
						</Button>
					</motion.div>
				}
			/>
			<motion.div
				className="grid gap-3 sm:grid-cols-2"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{
					duration: prefersReducedMotion
						? MOTION_DURATIONS.reducedMotionDuration
						: MOTION_DURATIONS.slow,
					delay: prefersReducedMotion ? 0 : 0.1,
				}}
			>
				<StatTile
					label="Active raters"
					value={engagementMetrics.peakActiveUsers}
					icon={Users}
					accent={true}
				/>
				<StatTile label="Matches played" value={engagementMetrics.totalMatches} icon={Trophy} />
			</motion.div>
		</Panel>
	);
});

// ============================================================================
// COMMUNITY CHARTS PANEL
// ============================================================================

export const PopularNamingTrendsChart = memo(function PopularNamingTrendsChart({
	leaderboard,
}: {
	leaderboard: LeaderboardEntry[];
}) {
	const data = useMemo(() => {
		// ⚡ Bolt Optimization: Filter, sort, and slice *before* mapping to avoid
		// creating objects for entries that will just be discarded by the slice.
		return leaderboard
			.filter((e) => e.total_ratings > 0)
			.sort((a, b) => b.total_ratings - a.total_ratings)
			.slice(0, 30)
			.map((e) => ({
				name: e.name.length > 12 ? `${e.name.slice(0, 11)}…` : e.name,
				popularity: e.total_ratings,
				rating: Math.round(e.avg_rating),
				wins: e.wins,
				fullName: e.name,
			}));
	}, [leaderboard]);

	if (data.length === 0) {
		return null;
	}

	return (
		<ChartFrame>
			<ScatterChart margin={{ top: 24, right: 24, left: 4, bottom: 16 }}>
				<CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
				<XAxis
					type="number"
					dataKey="popularity"
					name="Matches Played"
					tick={{ fontSize: 10, fill: CHART_TEXT_MUTED }}
					axisLine={false}
					tickLine={false}
					label={{
						value: "Total Matches Played",
						position: "insideBottom",
						offset: -8,
						fill: CHART_TEXT_MUTED,
						fontSize: 10,
					}}
				/>
				<YAxis
					type="number"
					dataKey="rating"
					name="Average Rating"
					tick={{ fontSize: 10, fill: CHART_TEXT_MUTED }}
					axisLine={false}
					tickLine={false}
					domain={["dataMin - 15", "dataMax + 15"]}
					label={{
						value: "Rating",
						angle: -90,
						position: "insideLeft",
						offset: 12,
						fill: CHART_TEXT_MUTED,
						fontSize: 10,
					}}
				/>
				<ZAxis type="number" dataKey="wins" range={[60, 500]} name="Wins" />
				<Tooltip
					cursor={{ strokeDasharray: "3 3", stroke: CHART_AXIS }}
					contentStyle={CHART_TOOLTIP_STYLE}
					formatter={(value: number | string, name: string) => {
						if (name === "popularity") {
							return [value, "Total Matches"];
						}
						if (name === "rating") {
							return [value, "Rating"];
						}
						if (name === "wins") {
							return [value, "Wins"];
						}
						return [value, name];
					}}
					labelFormatter={(label, payloads) => {
						if (payloads && payloads.length > 0) {
							return payloads[0].payload.fullName;
						}
						return label;
					}}
				/>
				<Scatter data={data} fill={CHART_SERIES[4]}>
					{data.map((_entry, index) => (
						<Cell key={`cell-${index}`} fill={CHART_SERIES[index % CHART_SERIES.length]} />
					))}
				</Scatter>
			</ScatterChart>
		</ChartFrame>
	);
});

const CommunityChartsPanel = memo(function CommunityChartsPanel({
	leaderboard,
	siteStats,
}: {
	leaderboard: LeaderboardItem[];
	siteStats: SiteStats | null;
}) {
	return (
		<Panel className="flex flex-col h-full">
			<SectionHeader
				icon={Activity}
				title="Community Insights"
				subtitle="Aggregate data across all users and matches."
				action={
					siteStats ? (
						<div className="flex items-center gap-4 text-xs font-medium">
							<span className="flex items-center gap-1.5 text-muted-foreground">
								<Users className="size-3.5 text-primary/70" />
								{siteStats.totalUsers} contributors
							</span>
							<span className="flex items-center gap-1.5 text-muted-foreground">
								<Target className="size-3.5 text-accent/70" />
								{siteStats.totalRatings} ratings
							</span>
						</div>
					) : undefined
				}
			/>

			<div className="grid gap-4 flex-1">
				<div className="grid gap-4 sm:grid-cols-2">
					<div className="space-y-2">
						<h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
							Top Contenders
						</h4>
						<TopNamesChart leaderboard={leaderboard} limit={8} />
					</div>

					<div className="space-y-2">
						<h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
							Win/Loss Head-to-Head
						</h4>
						<WinLossChart leaderboard={leaderboard} limit={8} />
					</div>
				</div>

				<div className="grid gap-4 sm:grid-cols-[1fr_minmax(0,18rem)]">
					<div className="space-y-2">
						<h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
							Rating Distribution Curve
						</h4>
						<RatingDistributionChart leaderboard={leaderboard} />
					</div>
					<div className="space-y-2">
						<h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
							Metrics Radar
						</h4>
						<RatingRadarChart leaderboard={leaderboard} limit={5} />
					</div>
				</div>
			</div>
		</Panel>
	);
});

// ============================================================================
// PERSONAL RESULTS
// ============================================================================

interface PersonalResultsProps {
	personalRatings: Record<string, RatingData>;
	currentTournamentNames?: NameItem[];
	onStartNew: () => void;
	onUpdateRatings: (
		ratings:
			| Record<string, RatingData>
			| ((prev: Record<string, RatingData>) => Record<string, RatingData>),
	) => void;
	userName: string;
}

const PersonalResults = ({
	personalRatings,
	currentTournamentNames,
	onStartNew,
	onUpdateRatings,
}: PersonalResultsProps) => {
	const [hasCopied, setHasCopied] = useState(false);
	const [showReorder, setShowReorder] = useState(false);

	const rankings = useMemo(() => {
		if (!currentTournamentNames) {
			return [];
		}

		return currentTournamentNames
			.flatMap((name) => {
				if (personalRatings[name.name] === undefined) return [];
				const pr = personalRatings[name.name];
				if (!pr) {
					return name;
				}

				return {
					...name,
					rating: pr.rating,
					wins: pr.wins,
					losses: pr.losses,
					total_ratings: pr.wins + pr.losses,
				};
			})
			.sort((a, b) => (b.rating as number) - (a.rating as number));
	}, [personalRatings, currentTournamentNames]);

	const topThree = rankings.slice(0, 3);
	const totalContenders = rankings.length;
	const champion = topThree[0];

	const handleCopyResults = async () => {
		if (!rankings.length) {
			return;
		}
		const lines = [
			"🐾 Name Nosferatu Tournament Results 🐾",
			"=====================================",
			...rankings.map((cat, idx) => {
				const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`;
				return `${medal} ${cat.name} — Rating: ${Math.round(cat.rating as number)}`;
			}),
			"=====================================",
			"Play and vote: Name Nosferatu Cat Tournaments",
		];
		try {
			await navigator.clipboard.writeText(lines.join("\n"));
			setHasCopied(true);
			setTimeout(() => setHasCopied(false), 2500);
		} catch (err) {
			ErrorManager.handleError(err, "PersonalResults.handleCopyResults");
		}
	};

	const handleSave = async (updatedRankings: NameItem[]) => {
		const numRankings = updatedRankings.length;
		if (numRankings === 0) {
			return;
		}

		const newRatings: Record<string, RatingData> = { ...personalRatings };

		let maxRating = -Infinity;
		let minRating = Infinity;
		for (let i = 0; i < numRankings; i++) {
			const item = updatedRankings[i];
			const rating = item?.rating;
			if (typeof rating === "number") {
				if (rating > maxRating) {
					maxRating = rating;
				}
				if (rating < minRating) {
					minRating = rating;
				}
			}
		}

		if (maxRating === -Infinity || minRating === Infinity || maxRating === minRating) {
			maxRating = 2000;
			minRating = 1000;
		}

		const ratingRange = maxRating - minRating;

		for (let i = 0; i < numRankings; i++) {
			const item = updatedRankings[i];
			if (!item) {
				continue;
			}

			const normalizedPosition = 1 - i / (numRankings - 1 || 1);
			const newRating = minRating + ratingRange * normalizedPosition;

			if (newRatings[item.name]) {
				const existing = newRatings[item.name];
				newRatings[item.name] = { ...existing, rating: Math.round(newRating) };
			} else {
				newRatings[item.name] = {
					rating: Math.round(newRating),
					wins: 0,
					losses: 0,
				};
			}
		}

		onUpdateRatings(newRatings);
	};

	if (!rankings.length) {
		return (
			<div className="flex h-32 items-center justify-center rounded-2xl border border-dashed text-sm text-muted-foreground">
				No personal ratings yet.
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Podium Banner Showcase */}
			{champion && (
				<div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-b from-primary/10 via-card/70 to-card/90 p-5 sm:p-6 backdrop-blur-xl shadow-lg">
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
						<div>
							<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-chart-4/15 text-chart-4 text-xs font-bold uppercase tracking-wider mb-1.5">
								<Crown size={14} />
								<span>Tournament Champion</span>
							</div>
							<h3 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
								{champion.name}
							</h3>
						</div>

						<div className="flex items-center gap-2 w-full sm:w-auto">
							<Button
								variant="outline"
								size="small"
								onClick={handleCopyResults}
								className="flex-1 sm:flex-none gap-1.5 text-xs font-semibold"
							>
								{hasCopied ? (
									<>
										<Check size={14} className="text-chart-2" />
										<span className="text-chart-2">Copied!</span>
									</>
								) : (
									<>
										<Copy size={14} />
										<span>Share Results</span>
									</>
								)}
							</Button>
							<Button
								variant="primary"
								size="small"
								onClick={() => setShowReorder((prev) => !prev)}
								className="flex-1 sm:flex-none text-xs font-semibold"
							>
								{showReorder ? "Close Reorder" : "Fine-Tune Ranks"}
							</Button>
						</div>
					</div>

					{/* Top 3 Podium Cards */}
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
						{topThree.map((cat, idx) => {
							const medal =
								idx === 0 ? "🥇 1st Place" : idx === 1 ? "🥈 2nd Place" : "🥉 3rd Place";
							const borderTone =
								idx === 0
									? "border-yellow-500/50 bg-yellow-500/10"
									: idx === 1
										? "border-slate-400/40 bg-slate-400/10"
										: "border-amber-700/40 bg-amber-700/10";

							return (
								<div
									key={cat.id || cat.name}
									className={cn(
										"flex flex-col justify-between p-4 rounded-xl border transition-all",
										borderTone,
									)}
								>
									<div className="flex items-center justify-between gap-2 mb-2">
										<span className="text-xs font-bold uppercase tracking-wider text-foreground">
											{medal}
										</span>
										<span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/20 text-primary text-xs font-extrabold tabular-nums">
											{Math.round(cat.rating as number)}
										</span>
									</div>
									<p className="text-base font-extrabold text-foreground truncate">{cat.name}</p>
									{cat.wins !== undefined && cat.losses !== undefined && (
										<p className="text-xs text-muted-foreground mt-1">
											Record: <span className="text-accent font-semibold">{cat.wins}W</span> -{" "}
											<span className="text-destructive/80 font-semibold">{cat.losses}L</span>
										</p>
									)}
								</div>
							);
						})}
					</div>

					{/* Quick stats footer */}
					<div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground">
						<span className="font-medium">Total Bracket Contenders: {totalContenders}</span>
						<span className="font-medium text-primary">Rankings Synced</span>
					</div>
				</div>
			)}

			{/* Drag and drop or accessible rank adjustment */}
			{showReorder && (
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -10 }}
				>
					<RankingAdjustment rankings={rankings} onSave={handleSave} onCancel={onStartNew} />
				</motion.div>
			)}
		</div>
	);
};

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

export interface DashboardProps {
	personalRatings?: Record<string, RatingData>;
	currentTournamentNames?: NameItem[];
	onStartNew?: () => void;
	onUpdateRatings?: (
		ratings:
			| Record<string, RatingData>
			| ((prev: Record<string, RatingData>) => Record<string, RatingData>),
	) => void;
	userName?: string;
	isAdmin?: boolean;
	isLoggedIn?: boolean;
	avatarUrl?: string;
	canHideNames?: boolean;
	onNameHidden?: (nameId: string) => void;
}

export function AnalyticsDashboard({
	userName = "",
	isAdmin = false,
	isLoggedIn = false,
	avatarUrl,
	onStartNew,
	onUpdateRatings,
	personalRatings,
	currentTournamentNames,
}: DashboardProps) {
	const handleStartNew = onStartNew ?? (() => undefined);
	const {
		engagementMetrics,
		isLoadingEngagement,
		isLoadingLeaderboard,
		leaderboard,
		refreshEngagementMetrics,
		setTimeframe,
		siteStats,
		timeframe,
		userStats,
	} = useDashboardData({ userName });
	const quickStats = useMemo(
		() => getQuickStats({ siteStats, userName, userStats }),
		[siteStats, userName, userStats],
	);
	const hasPersonalRatings = Boolean(personalRatings && Object.keys(personalRatings).length > 0);

	return (
		<div className="w-full space-y-8 sm:space-y-10">
			<DashboardHeader
				isLoggedIn={isLoggedIn}
				userName={userName}
				avatarUrl={avatarUrl}
				isAdmin={isAdmin}
				quickStats={quickStats}
				userStats={userStats}
			/>

			{hasPersonalRatings && onUpdateRatings && (
				<Panel>
					<SectionHeader
						icon={Trophy}
						title="Your Rankings"
						subtitle="Your saved order."
						action={<ContextBadge label="Personal" tone="accent" />}
					/>
					<PersonalResults
						personalRatings={personalRatings}
						currentTournamentNames={currentTournamentNames}
						onStartNew={handleStartNew}
						onUpdateRatings={onUpdateRatings}
						userName={userName}
					/>
				</Panel>
			)}

			<div className="grid gap-6 xl:grid-cols-[minmax(0,22rem)_1fr]">
				<LeaderboardPanel
					leaderboard={leaderboard}
					isLoadingLeaderboard={isLoadingLeaderboard}
					onStartNew={onStartNew}
				/>

				<CommunityChartsPanel leaderboard={leaderboard} siteStats={siteStats} />
			</div>

			<EngagementPanel
				engagementMetrics={engagementMetrics}
				timeframe={timeframe}
				setTimeframe={setTimeframe}
				refreshEngagementMetrics={refreshEngagementMetrics}
				isLoadingEngagement={isLoadingEngagement}
			/>
		</div>
	);
}

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

export type DashboardTab = "overview" | "names" | "users" | "analytics";
export type NameFilter = "all" | "active" | "hidden" | "locked";
export type BulkAction = "hide" | "unhide" | "lock" | "unlock";

export interface AdminStats {
	totalNames: number;
	activeNames: number;
	hiddenNames: number;
	lockedInNames: number;
	totalUsers: number;
	recentVotes: number;
}

export interface NameWithStats extends NameItem {
	votes?: number;
	lastVoted?: string;
	popularityScore?: number;
}

export interface SiteStatsLike {
	totalUsers?: unknown;
	totalRatings?: unknown;
}

export const ADMIN_TABS: readonly { value: DashboardTab; label: string }[] = [
	{ value: "overview", label: "Overview" },
	{ value: "names", label: "Names" },
	{ value: "users", label: "Users" },
	{ value: "analytics", label: "Analytics" },
];

export const FILTER_OPTIONS: readonly { value: NameFilter; label: string }[] = [
	{ value: "all", label: "All Names" },
	{ value: "active", label: "Active" },
	{ value: "hidden", label: "Hidden" },
	{ value: "locked", label: "Locked In" },
];

// ============================================================================
// UTILITIES
// ============================================================================

function toNumber(value: unknown): number {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
}

export function mapNameToDisplay(name: NameItem): NameWithStats {
	return {
		...name,
		votes: Number((name.wins || 0) + (name.losses || 0)),
		lastVoted: undefined,
		popularityScore: Number(name.popularity_score ?? 0),
	};
}

export function buildAdminStats(
	names: NameWithStats[],
	siteStats: SiteStatsLike | null,
): AdminStats {
	let activeNames = 0;
	let hiddenNames = 0;
	let lockedInNames = 0;

	// ⚡ Bolt: Single O(N) pass to avoid three separate O(N) array filters.
	// Reduces overhead and allocations on large datasets.
	for (let i = 0; i < names.length; i++) {
		const name = names[i];
		const hidden = isNameHidden(name);
		const locked = isNameLocked(name);

		if (hidden) hiddenNames++;
		if (locked) lockedInNames++;
		if (!hidden && !locked) activeNames++;
	}

	return {
		totalNames: names.length,
		activeNames,
		hiddenNames,
		lockedInNames,
		totalUsers: toNumber(siteStats?.totalUsers),
		recentVotes: toNumber(siteStats?.totalRatings),
	};
}

export function filterNamesByStatusAndSearch(
	names: NameWithStats[],
	filterStatus: NameFilter,
	searchTerm: string,
): NameWithStats[] {
	let filtered = names;

	if (filterStatus === "active") {
		filtered = getActiveNames(filtered);
	} else if (filterStatus === "hidden") {
		filtered = getHiddenNames(filtered);
	} else if (filterStatus === "locked") {
		filtered = getLockedNames(filtered);
	}

	const normalizedSearch = searchTerm.trim().toLowerCase();
	if (!normalizedSearch) {
		return filtered;
	}

	return filtered.filter((name) => matchesNameSearchTerm(name, normalizedSearch));
}

// ============================================================================
// COMPONENTS
// ============================================================================

interface AdminStatsGridProps {
	stats: AdminStats;
}

export function AdminStatsGrid({ stats }: AdminStatsGridProps) {
	const statCards = [
		{
			icon: BarChart3,
			accentColor: "text-primary",
			bgColor: "bg-primary/10",
			borderColor: "border-primary/20",
			label: "Total Pool",
			value: stats.totalNames,
		},
		{
			icon: Eye,
			accentColor: "text-accent",
			bgColor: "bg-accent/10",
			borderColor: "border-accent/20",
			label: "Active In Pool",
			value: stats.activeNames,
		},
		{
			icon: Lock,
			accentColor: "text-amber-400",
			bgColor: "bg-amber-400/10",
			borderColor: "border-amber-400/20",
			label: "Locked In",
			value: stats.lockedInNames,
		},
		{
			icon: EyeOff,
			accentColor: "text-destructive",
			bgColor: "bg-destructive/10",
			borderColor: "border-destructive/20",
			label: "Hidden From Public",
			value: stats.hiddenNames,
		},
	];

	return (
		<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
			{statCards.map(({ icon: Icon, accentColor, bgColor, borderColor, label, value }) => (
				<div
					key={label}
					className={`group relative overflow-hidden rounded-2xl border ${borderColor} bg-card/70 p-4 sm:p-5 shadow-sm backdrop-blur-sm transition-all hover:border-border hover:shadow-md`}
				>
					<div className="flex items-center justify-between gap-2 mb-2">
						<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							{label}
						</span>
						<div
							className={`flex size-8 items-center justify-center rounded-lg ${bgColor} ${accentColor}`}
						>
							<Icon size={16} />
						</div>
					</div>
					<p className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
						{value}
					</p>
				</div>
			))}
		</div>
	);
}

function AdminNameItem({
	name,
	onToggleHidden,
	onToggleLocked,
	onDelete,
}: {
	name: NameWithStats;
	onToggleHidden: (nameId: string | number, isHidden: boolean) => void;
	onToggleLocked: (nameId: string | number, isLocked: boolean) => void;
	onDelete: (nameId: string | number) => void;
}) {
	const hidden = isNameHidden(name);
	const locked = isNameLocked(name);

	return (
		<div className="group flex items-center justify-between gap-3 p-3 sm:p-4 transition-colors hover:bg-muted/30">
			<div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2 flex-wrap">
						<h4 className="font-display text-sm sm:text-base font-bold text-foreground truncate">
							{name.name}
						</h4>
						{locked && (
							<span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
								<Lock size={10} /> Locked
							</span>
						)}
						{hidden && (
							<span className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
								<EyeOff size={10} /> Hidden
							</span>
						)}
					</div>
					{name.description && (
						<p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{name.description}</p>
					)}
					<div className="mt-1 flex flex-wrap items-center gap-3 font-mono text-[11px] text-muted-foreground">
						<span>
							Votes: <strong className="text-foreground/80">{name.votes ?? 0}</strong>
						</span>
						<span>&middot;</span>
						<span>
							Score:{" "}
							<strong className="text-foreground/80">
								{name.popularityScore == null ? "—" : name.popularityScore.toFixed(1)}
							</strong>
						</span>
					</div>
				</div>
			</div>

			<div className="flex items-center gap-1 shrink-0">
				<Button
					onClick={() => onToggleHidden(name.id, hidden)}
					variant="ghost"
					size="small"
					iconOnly={true}
					aria-label={hidden ? "Unhide name" : "Hide name"}
					title={hidden ? "Unhide name" : "Hide name"}
				>
					{hidden ? <Eye size={15} /> : <EyeOff size={15} />}
				</Button>
				<Button
					onClick={() => onToggleLocked(name.id, locked)}
					variant="ghost"
					size="small"
					iconOnly={true}
					aria-label={locked ? "Unlock name" : "Lock name"}
					title={locked ? "Unlock name" : "Lock name"}
				>
					{locked ? <Unlock size={15} /> : <Lock size={15} />}
				</Button>
				<Button
					onClick={() => onDelete(name.id)}
					variant="ghost"
					size="small"
					iconOnly={true}
					aria-label="Delete name"
					title="Delete name"
					className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-300"
				>
					<Trash2 size={15} />
				</Button>
			</div>
		</div>
	);
}

interface AdminNamesTabProps {
	searchTerm: string;
	onSearchTermChange: (value: string) => void;
	filterStatus: string;
	filterOptions: readonly { value: string; label: string }[];
	onFilterChange: (event: ChangeEvent<HTMLSelectElement>) => void;
	onRefresh: () => void;
	filteredNames: NameWithStats[];
	onToggleHidden: (nameId: string | number, isHidden: boolean) => void;
	onToggleLocked: (nameId: string | number, isLocked: boolean) => void;
	onDelete: (nameId: string | number) => void;
}

export function AdminNamesTab({
	searchTerm,
	onSearchTermChange,
	filterStatus,
	filterOptions,
	onFilterChange,
	onRefresh,
	filteredNames,
	onToggleHidden,
	onToggleLocked,
	onDelete,
}: AdminNamesTabProps) {
	return (
		<div className="space-y-4">
			<SearchFilterBar
				searchTerm={searchTerm}
				onSearchTermChange={onSearchTermChange}
				filterStatus={filterStatus}
				filterOptions={filterOptions}
				onFilterChange={onFilterChange}
				onRefresh={onRefresh}
			/>

			<div className="overflow-hidden rounded-2xl border border-border/40 bg-card/60 divide-y divide-border/20 shadow-sm backdrop-blur-sm">
				{filteredNames.length > 0 ? (
					filteredNames.map((name) => (
						<AdminNameItem
							key={name.id}
							name={name}
							onToggleHidden={onToggleHidden}
							onToggleLocked={onToggleLocked}
							onDelete={onDelete}
						/>
					))
				) : (
					<div className="p-8 text-center text-sm text-muted-foreground">
						No cat names match the selected filter.
					</div>
				)}
			</div>
		</div>
	);
}

// ============================================================================
// CUSTOM HOOK
// ============================================================================

export function useAdminDashboard() {
	const user = useAppStore((s) => s.user);
	const actorName = user.name.trim();
	const { deleteName, toggleHidden, toggleLocked } = useNameAdminActions(actorName);

	const [searchTerm, setSearchTerm] = useState("");
	const [filterStatus, setFilterStatus] = useState<NameFilter>("all");
	const namesQuery = useQuery(namesQueryOptions(true));
	const siteStatsQuery = useQuery({
		queryKey: ["site-stats"],
		queryFn: () => statsAPI.getSiteStats(),
		staleTime: 30_000,
	});
	const names = useMemo(
		() => (namesQuery.data?.names ?? []).map(mapNameToDisplay),
		[namesQuery.data?.names],
	);
	const stats = useMemo(
		() => buildAdminStats(names, siteStatsQuery.data ?? null),
		[names, siteStatsQuery.data],
	);
	const isLoading = namesQuery.isPending || siteStatsQuery.isPending;

	const filteredNames = useMemo(
		() => filterNamesByStatusAndSearch(names, filterStatus, searchTerm),
		[names, filterStatus, searchTerm],
	);

	const handleToggleHidden = useCallback(
		async (nameId: string | number, isHidden: boolean) => {
			await toggleHidden({
				nameId: String(nameId),
				isCurrentlyHidden: isHidden,
			});
		},
		[toggleHidden],
	);

	const handleToggleLocked = useCallback(
		async (nameId: string | number, isLocked: boolean) => {
			await toggleLocked({
				nameId: String(nameId),
				isCurrentlyLocked: isLocked,
			});
		},
		[toggleLocked],
	);

	const handleSoftDelete = useCallback(
		async (nameId: string | number) => {
			if (!window.confirm("Permanently delete this name? This cannot be undone.")) {
				return;
			}
			await deleteName({ nameId: String(nameId) });
		},
		[deleteName],
	);

	const handleFilterChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
		const option = FILTER_OPTIONS.find((item) => item.value === event.target.value);
		if (option) {
			setFilterStatus(option.value);
		}
	}, []);

	const handleRefresh = useCallback(() => {
		void Promise.all([namesQuery.refetch(), siteStatsQuery.refetch()]);
	}, [namesQuery, siteStatsQuery]);

	return {
		searchTerm,
		setSearchTerm,
		filterStatus,
		stats,
		isLoading,
		filteredNames,
		handleToggleHidden,
		handleToggleLocked,
		handleSoftDelete,
		handleFilterChange,
		handleRefresh,
	};
}

// ============================================================================
// MAIN COMPONENT EXPORT
// ============================================================================

export function AdminDashboard() {
	const {
		searchTerm,
		setSearchTerm,
		filterStatus,
		stats,
		isLoading,
		filteredNames,
		handleToggleHidden,
		handleToggleLocked,
		handleSoftDelete,
		handleFilterChange,
		handleRefresh,
	} = useAdminDashboard();

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<Loading variant="spinner" text="Loading admin dashboard..." />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background text-foreground p-3 sm:p-6">
			<div className="mb-4 sm:mb-8">
				<h1 className="text-2xl sm:text-4xl font-bold mb-1 sm:mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
					Admin Dashboard
				</h1>
				<p className="text-sm text-muted-foreground">Manage names and monitor activity</p>
			</div>

			{stats ? <AdminStatsGrid stats={stats} /> : null}

			<AdminNamesTab
				searchTerm={searchTerm}
				onSearchTermChange={setSearchTerm}
				filterStatus={filterStatus}
				filterOptions={FILTER_OPTIONS}
				onFilterChange={handleFilterChange}
				onRefresh={handleRefresh}
				filteredNames={filteredNames}
				onToggleHidden={(nameId, hidden) => void handleToggleHidden(nameId, hidden)}
				onToggleLocked={(nameId, locked) => void handleToggleLocked(nameId, locked)}
				onDelete={(nameId) => void handleSoftDelete(nameId)}
			/>
		</div>
	);
}

type DashboardView = "analytics" | "moderation";

const DASHBOARD_VIEW_OPTIONS = [
	{
		value: "analytics",
		label: "Analytics",
		icon: <LayoutDashboard size={18} />,
	},
	{ value: "moderation", label: "Moderation", icon: <Shield size={18} /> },
] as const satisfies readonly {
	value: DashboardView;
	label: string;
	icon: ReactNode;
}[];

interface UnifiedDashboardProps {
	personalRatings?: Record<string, RatingData>;
	currentTournamentNames?: NameItem[];
	onStartNew?: () => void;
	onUpdateRatings?: (
		ratings:
			| Record<string, RatingData>
			| ((prev: Record<string, RatingData>) => Record<string, RatingData>),
	) => void;
	userName?: string;
	isAdmin?: boolean;
	isLoggedIn?: boolean;
	avatarUrl?: string;
	canHideNames?: boolean;
	onNameHidden?: (nameId: string) => void;
}

export function Dashboard(props: UnifiedDashboardProps) {
	const [activeView, setActiveView] = useState<DashboardView>("analytics");

	if (!props.isAdmin) {
		return (
			<div className="w-full space-y-6">
				<AnalyticsDashboard {...props} />
			</div>
		);
	}

	return (
		<div className="w-full space-y-6">
			<div className="flex items-center gap-4 border-b border-border pb-4">
				<div className="flex gap-2">
					{DASHBOARD_VIEW_OPTIONS.map((opt) => (
						<button
							key={opt.value}
							type="button"
							onClick={() => setActiveView(opt.value)}
							className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
								activeView === opt.value
									? "bg-primary text-primary-foreground"
									: "bg-muted text-muted-foreground hover:bg-muted/80"
							}`}
						>
							{opt.icon}
							{opt.label}
						</button>
					))}
				</div>
			</div>

			{activeView === "analytics" ? <AnalyticsDashboard {...props} /> : <AdminDashboard />}
		</div>
	);
}
