import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import { bucketLabel, useRatingDistributionData } from "../hooks/useRatingDistributionData";
import { CHART_GRID, CHART_PALETTE, CHART_TEXT_MUTED } from "./chartTheme";
import { CHART_CURSOR, CHART_TOOLTIP_STYLE, ChartFrame } from "./DashboardPrimitives";
import { RatingStatsPanel } from "./RatingStatsPanel";

interface RatingDistributionChartProps {
	leaderboard: Array<{
		name: string;
		avg_rating: number;
		wins: number;
		total_ratings: number;
	}>;
}

export function RatingDistributionChart({ leaderboard }: RatingDistributionChartProps) {
	const { stats, data, meanBucket, stdDevBuckets, maxCount } =
		useRatingDistributionData(leaderboard);

	if (data.length === 0) {
		return (
			<div className="surface-panel-inset flex h-40 items-center justify-center rounded-2xl border border-dashed px-4 text-center text-sm text-muted-foreground/70">
				Not enough rated names yet to draw a distribution.
			</div>
		);
	}

	const meanRange = meanBucket === null ? null : bucketLabel(meanBucket);

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

			<RatingStatsPanel stats={stats} />
		</div>
	);
}
