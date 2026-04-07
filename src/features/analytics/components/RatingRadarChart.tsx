/**
 * @module RatingRadarChart
 * @description Radar chart comparing top names across rating, wins, and total ratings
 */

import {
	PolarAngleAxis,
	PolarGrid,
	PolarRadiusAxis,
	Radar,
	RadarChart,
	ResponsiveContainer,
	Tooltip,
} from "recharts";

interface RatingRadarChartProps {
	leaderboard: Array<{
		name: string;
		avg_rating: number;
		wins: number;
		total_ratings: number;
	}>;
	limit?: number;
}

export function RatingRadarChart({ leaderboard, limit = 6 }: RatingRadarChartProps) {
	const top = leaderboard.slice(0, limit);
	if (top.length < 3) return null;

	const maxRating = Math.max(...top.map((e) => e.avg_rating));
	const maxWins = Math.max(...top.map((e) => e.wins)) || 1;
	const maxTotal = Math.max(...top.map((e) => e.total_ratings)) || 1;

	const data = top.map((e) => ({
		name: e.name.length > 10 ? `${e.name.slice(0, 9)}…` : e.name,
		rating: Math.round((e.avg_rating / maxRating) * 100),
		wins: Math.round((e.wins / maxWins) * 100),
		activity: Math.round((e.total_ratings / maxTotal) * 100),
	}));

	return (
		<div className="h-56 sm:h-72 w-full">
			<ResponsiveContainer width="100%" height="100%">
				<RadarChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
					<PolarGrid stroke="hsl(var(--border) / 0.25)" />
					<PolarAngleAxis
						dataKey="name"
						tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
					/>
					<PolarRadiusAxis
						angle={30}
						domain={[0, 100]}
						tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground) / 0.5)" }}
						axisLine={false}
					/>
					<Tooltip
						contentStyle={{
							background: "hsl(var(--card))",
							border: "1px solid hsl(var(--border) / 0.3)",
							borderRadius: 12,
							fontSize: 12,
							color: "hsl(var(--foreground))",
						}}
					/>
					<Radar
						name="Rating"
						dataKey="rating"
						stroke="hsl(var(--primary))"
						fill="hsl(var(--primary) / 0.2)"
						strokeWidth={2}
					/>
					<Radar
						name="Wins"
						dataKey="wins"
						stroke="hsl(var(--chart-2))"
						fill="hsl(var(--chart-2) / 0.15)"
						strokeWidth={2}
					/>
					<Radar
						name="Activity"
						dataKey="activity"
						stroke="hsl(var(--chart-4))"
						fill="hsl(var(--chart-4) / 0.1)"
						strokeWidth={1.5}
						strokeDasharray="4 2"
					/>
				</RadarChart>
			</ResponsiveContainer>
		</div>
	);
}
