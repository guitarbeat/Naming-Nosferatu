import { useMemo } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { computeRatingStats } from "@/shared/lib/ratingStats";

interface RatingDistributionChartProps {
	leaderboard: Array<{
		name: string;
		avg_rating: number;
		wins: number;
		total_ratings: number;
	}>;
}

const BUCKET_SIZE = 50;

function bucketLabel(bucketStart: number) {
	return `${bucketStart}–${bucketStart + BUCKET_SIZE}`;
}

export function RatingDistributionChart({ leaderboard }: RatingDistributionChartProps) {
	const ratings = useMemo(() => leaderboard.map((e) => Math.round(e.avg_rating)), [leaderboard]);

	const stats = useMemo(() => computeRatingStats(ratings), [ratings]);

	const data = useMemo(() => {
		if (ratings.length === 0) return [];

		const minBucket = Math.floor(Math.min(...ratings) / BUCKET_SIZE) * BUCKET_SIZE;
		const maxBucket = Math.ceil(Math.max(...ratings) / BUCKET_SIZE) * BUCKET_SIZE;

		const buckets: Record<number, number> = {};
		for (let b = minBucket; b <= maxBucket; b += BUCKET_SIZE) buckets[b] = 0;
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
		if (!stats) return null;
		return Math.floor(stats.mean / BUCKET_SIZE) * BUCKET_SIZE;
	}, [stats]);

	const stdDevBuckets = useMemo(() => {
		if (!stats) return null;
		const lo = Math.floor((stats.mean - stats.stdDev) / BUCKET_SIZE) * BUCKET_SIZE;
		const hi = Math.floor((stats.mean + stats.stdDev) / BUCKET_SIZE) * BUCKET_SIZE;
		return { lo: bucketLabel(lo), hi: bucketLabel(hi) };
	}, [stats]);

	if (data.length === 0) return null;

	const meanRange = meanBucket !== null ? bucketLabel(meanBucket) : null;

	return (
		<div className="space-y-3">
			<div className="h-52 sm:h-64 w-full">
				<ResponsiveContainer width="100%" height="100%">
					<BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
						<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.2)" />
						<XAxis
							dataKey="range"
							tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
							axisLine={{ stroke: "hsl(var(--border) / 0.3)" }}
							tickLine={false}
						/>
						<YAxis
							allowDecimals={false}
							tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
							axisLine={false}
							tickLine={false}
						/>
						<Tooltip
							contentStyle={{
								background: "hsl(var(--card))",
								border: "1px solid hsl(var(--border) / 0.3)",
								borderRadius: 12,
								fontSize: 12,
								color: "hsl(var(--foreground))",
							}}
							cursor={{ fill: "hsl(var(--primary) / 0.06)" }}
						/>
						<Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40}>
							{data.map((_, i) => (
								<Cell key={i} fill={`hsl(var(--primary) / ${0.4 + (i / data.length) * 0.6})`} />
							))}
						</Bar>
						{meanRange && (
							<ReferenceLine
								x={meanRange}
								stroke="hsl(var(--primary))"
								strokeDasharray="4 3"
								strokeWidth={2}
								label={{
									value: "μ",
									position: "top",
									fill: "hsl(var(--primary))",
									fontSize: 11,
									fontWeight: 700,
								}}
							/>
						)}
						{stdDevBuckets && (
							<>
								<ReferenceLine
									x={stdDevBuckets.lo}
									stroke="hsl(var(--muted-foreground))"
									strokeDasharray="2 4"
									strokeWidth={1}
									label={{
										value: "−σ",
										position: "top",
										fill: "hsl(var(--muted-foreground))",
										fontSize: 9,
									}}
								/>
								<ReferenceLine
									x={stdDevBuckets.hi}
									stroke="hsl(var(--muted-foreground))"
									strokeDasharray="2 4"
									strokeWidth={1}
									label={{
										value: "+σ",
										position: "top",
										fill: "hsl(var(--muted-foreground))",
										fontSize: 9,
									}}
								/>
							</>
						)}
					</BarChart>
				</ResponsiveContainer>
			</div>

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
