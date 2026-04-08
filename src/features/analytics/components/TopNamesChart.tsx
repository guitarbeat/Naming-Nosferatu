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

interface TopNamesChartProps {
	leaderboard: Array<{
		name: string;
		avg_rating: number;
		wins: number;
		total_ratings: number;
		percentile_rank?: number;
	}>;
	limit?: number;
}

const COLORS = [
	"hsl(var(--chart-4))",
	"hsl(var(--chart-1))",
	"hsl(var(--chart-2))",
	"hsl(var(--chart-3))",
	"hsl(var(--chart-5))",
];

export function TopNamesChart({ leaderboard, limit = 8 }: TopNamesChartProps) {
	const data = leaderboard.slice(0, limit).map((e) => ({
		name: e.name.length > 10 ? `${e.name.slice(0, 9)}…` : e.name,
		rating: Math.round(e.avg_rating),
		fullName: e.name,
		percentile: e.percentile_rank ?? null,
	}));

	if (data.length === 0) return null;

	const allRatings = leaderboard.map((e) => e.avg_rating);
	const stats = computeRatingStats(allRatings);
	const meanRating = stats ? Math.round(stats.mean) : null;

	return (
		<div className="h-52 sm:h-64 w-full">
			<ResponsiveContainer width="100%" height="100%">
				<BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
					<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.2)" horizontal={false} />
					<XAxis
						type="number"
						tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
						axisLine={false}
						tickLine={false}
						domain={["dataMin - 50", "dataMax + 20"]}
					/>
					<YAxis
						dataKey="name"
						type="category"
						width={72}
						tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }}
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
						formatter={(value: number, _: string, props: { payload: { fullName: string; percentile: number | null } }) => {
							const label = props.payload.fullName;
							const pct = props.payload.percentile;
							return [
								`${value}${pct !== null ? ` (top ${100 - pct}%)` : ""}`,
								label,
							];
						}}
						cursor={{ fill: "hsl(var(--primary) / 0.06)" }}
					/>
					<Bar dataKey="rating" radius={[0, 6, 6, 0]} maxBarSize={28}>
						{data.map((_, i) => (
							<Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.85} />
						))}
					</Bar>
					{meanRating !== null && (
						<ReferenceLine
							x={meanRating}
							stroke="hsl(var(--muted-foreground))"
							strokeDasharray="4 3"
							strokeWidth={1.5}
							label={{
								value: `avg ${meanRating}`,
								position: "insideBottomRight",
								fill: "hsl(var(--muted-foreground))",
								fontSize: 9,
							}}
						/>
					)}
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}
