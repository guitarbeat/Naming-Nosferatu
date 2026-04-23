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
import { CHART_GRID, CHART_PALETTE, CHART_TEXT_MUTED } from "./chartTheme";

interface WinLossChartProps {
        leaderboard: Array<{
                name: string;
                avg_rating: number;
                wins: number;
                losses: number;
                total_ratings: number;
        }>;
        limit?: number;
}

export function WinLossChart({ leaderboard, limit = 8 }: WinLossChartProps) {
        const data = leaderboard
                .filter((e) => (e.wins ?? 0) + (e.losses ?? 0) > 0)
                .slice(0, limit)
                .map((e) => ({
                        name: e.name.length > 8 ? `${e.name.slice(0, 7)}…` : e.name,
                        wins: e.wins ?? 0,
                        losses: e.losses ?? 0,
                }));

        if (data.length === 0) {
                return (
                        <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/15 px-4 text-center text-sm text-muted-foreground/70">
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
}
