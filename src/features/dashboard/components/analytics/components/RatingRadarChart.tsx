import {
	PolarAngleAxis,
	PolarGrid,
	PolarRadiusAxis,
	Radar,
	RadarChart,
	Tooltip,
} from "recharts";
import { CHART_GRID, CHART_PALETTE, CHART_TEXT_MUTED } from "./chartTheme";
import { CHART_TOOLTIP_STYLE, ChartFrame } from "./DashboardPrimitives";

interface RatingRadarChartProps {
	leaderboard: Array<{
		name: string;
		avg_rating: number;
		wins: number;
		losses?: number;
		total_ratings: number;
	}>;
	limit?: number;
}

export function RatingRadarChart({
	leaderboard,
	limit = 6,
}: RatingRadarChartProps) {
	const top = leaderboard
		.filter((e) => (e.total_ratings ?? 0) > 0)
		.slice(0, limit);
	if (top.length < 3) {
		return null;
	}

	// ⚡ BOLT: Replace multiple Math.max(...array.map()) calls with a single loop to avoid multiple array allocations and call stack limit risks
	let maxRating = 1;
	let maxWins = 1;
	let maxTotal = 1;
	for (let i = 0; i < top.length; i++) {
		if (top[i].avg_rating > maxRating) maxRating = top[i].avg_rating;
		if (top[i].wins > maxWins) maxWins = top[i].wins;
		if (top[i].total_ratings > maxTotal) maxTotal = top[i].total_ratings;
	}

	const data = top.map((e) => ({
		name: e.name.length > 10 ? `${e.name.slice(0, 9)}…` : e.name,
		rating: Math.round((e.avg_rating / maxRating) * 100),
		wins: Math.round((e.wins / maxWins) * 100),
		activity: Math.round((e.total_ratings / maxTotal) * 100),
	}));

	return (
		<ChartFrame variant="tall">
			<RadarChart
				data={data}
				margin={{ top: 8, right: 24, bottom: 8, left: 24 }}
			>
				<PolarGrid stroke={CHART_GRID} />
				<PolarAngleAxis
					dataKey="name"
					tick={{ fontSize: 10, fill: CHART_TEXT_MUTED }}
				/>
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
}
