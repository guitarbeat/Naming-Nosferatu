import { useMemo } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

interface RatingDistributionChartProps {
	leaderboard: Array<{
		name: string;
		avg_rating: number;
		wins: number;
		total_ratings: number;
	}>;
}

const BUCKET_SIZE = 50;

export function RatingDistributionChart({ leaderboard }: RatingDistributionChartProps) {
	const data = useMemo(() => {
		if (leaderboard.length === 0) return [];

		const ratings = leaderboard.map((e) => Math.round(e.avg_rating));
		const min = Math.floor(Math.min(...ratings) / BUCKET_SIZE) * BUCKET_SIZE;
		const max = Math.ceil(Math.max(...ratings) / BUCKET_SIZE) * BUCKET_SIZE;

		const buckets: Record<number, number> = {};
		for (let b = min; b <= max; b += BUCKET_SIZE) buckets[b] = 0;
		for (const r of ratings) {
			const bucket = Math.floor(r / BUCKET_SIZE) * BUCKET_SIZE;
			buckets[bucket] = (buckets[bucket] ?? 0) + 1;
		}

		return Object.entries(buckets)
			.map(([key, count]) => ({ range: `${key}–${Number(key) + BUCKET_SIZE}`, count }))
			.sort((a, b) => a.range.localeCompare(b.range));
	}, [leaderboard]);

	if (data.length === 0) return null;

	return (
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
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}
