import {
        Bar,
        BarChart,
        CartesianGrid,
        Cell,
        ReferenceLine,
        Tooltip,
        XAxis,
        YAxis,
} from "recharts";
import { computeRatingStats } from "@/shared/lib/ratingStats";
import { CHART_CURSOR, CHART_TOOLTIP_STYLE, ChartFrame } from "./DashboardPrimitives";
import {
        CHART_AXIS,
        CHART_FOREGROUND,
        CHART_GRID,
        CHART_SERIES,
        CHART_TEXT_MUTED,
} from "./chartTheme";

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

export function TopNamesChart({ leaderboard, limit = 8 }: TopNamesChartProps) {
        const data = leaderboard.slice(0, limit).map((e) => ({
                name: e.name.length > 10 ? `${e.name.slice(0, 9)}…` : e.name,
                rating: Math.round(e.avg_rating),
                fullName: e.name,
                percentile: e.percentile_rank ?? null,
        }));

        if (data.length === 0) {
                return null;
        }

        const allRatings = leaderboard.map((e) => e.avg_rating);
        const stats = computeRatingStats(allRatings);
        const meanRating = stats ? Math.round(stats.mean) : null;

        return (
                <ChartFrame>
                        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
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
                                        tick={{ fontSize: 11, fill: CHART_FOREGROUND }}
                                        axisLine={false}
                                        tickLine={false}
                                />
                                <Tooltip
                                        contentStyle={CHART_TOOLTIP_STYLE}
                                        formatter={(
                                                value: number,
                                                _: string,
                                                props: { payload: { fullName: string; percentile: number | null } },
                                        ) => {
                                                const label = props.payload.fullName;
                                                const pct = props.payload.percentile;
                                                return [`${value}${pct !== null ? ` (top ${100 - pct}%)` : ""}`, label];
                                        }}
                                        cursor={CHART_CURSOR}
                                />
                                <Bar dataKey="rating" radius={[0, 6, 6, 0]} maxBarSize={28}>
                                        {data.map((_, i) => (
                                                <Cell key={i} fill={CHART_SERIES[i % CHART_SERIES.length]} />
                                        ))}
                                </Bar>
                                {meanRating !== null && (
                                        <ReferenceLine
                                                x={meanRating}
                                                stroke={CHART_AXIS}
                                                strokeDasharray="4 3"
                                                strokeWidth={1.5}
                                                label={{
                                                        value: `avg ${meanRating}`,
                                                        position: "insideBottomRight",
                                                        fill: CHART_TEXT_MUTED,
                                                        fontSize: 9,
                                                }}
                                        />
                                )}
                        </BarChart>
                </ChartFrame>
        );
}
