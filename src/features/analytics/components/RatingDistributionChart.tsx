import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import { computeRatingStats } from "@/shared/lib/ratingStats";
import { CHART_GRID, CHART_PALETTE, CHART_TEXT_MUTED } from "./chartTheme";
import { CHART_CURSOR, CHART_TOOLTIP_STYLE, ChartFrame } from "./DashboardPrimitives";

interface RatingDistributionChartProps {
	leaderboard: Array<{
		name: string;
		avg_rating: number;
		wins: number;
		total_ratings: number;
	}>;
}

const BUCKET_SIZE = 25;

function bucketLabel(bucketStart: number) {
	return `${bucketStart}–${bucketStart + BUCKET_SIZE}`;
}

export function RatingDistributionChart({ leaderboard }: RatingDistributionChartProps) {
	const ratings = useMemo(
		() =>
			leaderboard.filter((e) => (e.total_ratings ?? 0) > 0).map((e) => Math.round(e.avg_rating)),
		[leaderboard],
	);

	const stats = useMemo(() => computeRatingStats(ratings), [ratings]);

	const data = useMemo(() => {
		if (ratings.length === 0) {
			return [];
		}

		const minBucket = Math.floor(Math.min(...ratings) / BUCKET_SIZE) * BUCKET_SIZE;
		const maxBucket = Math.ceil(Math.max(...ratings) / BUCKET_SIZE) * BUCKET_SIZE;

		const buckets: Record<number, number> = {};
		for (let b = minBucket; b <= maxBucket; b += BUCKET_SIZE) {
			buckets[b] = 0;
		}
		for (const r of ratings) {
			const bucket = Math.floor(r / BUCKET_SIZE) * BUCKET_SIZE;
			buckets[bucket] = (buckets[bucket] ?? 0) + 1;
		}

		return Object.entries(buckets)
			.map(([key, count]) => ({
				range: bucketLabel(Number(key)),
				bucketStart: Number(key),
				count,
			}))
			.sort((a, b) => a.bucketStart - b.bucketStart);
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
			<div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/15 px-4 text-center text-sm text-muted-foreground/70">
				Not enough rated names yet to draw a distribution.
			</div>
		);
	}

	const meanRange = meanBucket === null ? null : bucketLabel(meanBucket);
	const maxCount = Math.max(...data.map((d) => d.count));

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
						{data.map((d, i) => (
							<Cell
								key={i}
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
}
