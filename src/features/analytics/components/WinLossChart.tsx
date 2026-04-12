import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { CHART_CURSOR, CHART_TOOLTIP_STYLE, ChartFrame } from "./DashboardPrimitives";

interface WinLossChartProps {
	leaderboard: Array<{
		name: string;
		avg_rating: number;
		wins: number;
		total_ratings: number;
	}>;
	limit?: number;
}

export function WinLossChart({ leaderboard, limit = 8 }: WinLossChartProps) {
	const data = leaderboard.slice(0, limit).map((e) => ({
		name: e.name.length > 8 ? `${e.name.slice(0, 7)}…` : e.name,
		wins: e.wins,
		losses: Math.max(0, e.total_ratings - e.wins),
	}));

	if (data.length === 0) {
		return null;
	}

	return (
		<ChartFrame>
			<BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
				<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.2)" />
				<XAxis
					dataKey="name"
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
				<Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={CHART_CURSOR} />
				<Legend wrapperStyle={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }} />
				<Bar dataKey="wins" stackId="a" fill="hsl(var(--chart-2))" radius={[0, 0, 0, 0]} maxBarSize={32} />
				<Bar
					dataKey="losses"
					stackId="a"
					fill="hsl(var(--chart-1) / 0.5)"
					radius={[4, 4, 0, 0]}
					maxBarSize={32}
				/>
			</BarChart>
		</ChartFrame>
	);
}
