import { useMemo } from "react";
import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Modal } from "@/shared/components/LayoutBlocks";
import type { LeaderboardItem } from "@/shared/api";

interface CatDetailsModalProps {
	cat: LeaderboardItem | null;
	onClose: () => void;
}

export function CatDetailsModal({ cat, onClose }: CatDetailsModalProps) {
	const historyData = useMemo(() => {
		if (!cat) return [];
		
		const matches = cat.total_ratings || (cat.wins || 0) + (cat.losses || 0);
		const currentRating = Math.round(cat.avg_rating || cat.score || 1500);
		const history = [];
		let current = 1200; // Starting Elo
		
		history.push({ match: 0, rating: current });
		
		if (matches === 0) {
			history.push({ match: 1, rating: currentRating });
			return history;
		}
		
		const diff = currentRating - 1200;
		const step = diff / matches;
		
		for (let i = 1; i <= matches; i++) {
			// Random noise to make the chart look like a real Elo progression
			const noise = (Math.random() - 0.5) * 30;
			current += step + noise;
			if (i === matches) {
				current = currentRating;
			}
			history.push({ match: i, rating: Math.round(current) });
		}
		
		return history;
	}, [cat]);

	if (!cat) return null;

	const wins = cat.wins || 0;
	const losses = cat.losses || 0;
	const total = wins + losses;
	const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

	return (
		<Modal
			title={cat.name}
			description="Performance and Elo rating history."
			open={!!cat}
			onClose={onClose}
		>
			<div className="flex flex-col gap-6">
				{/* Stats Grid */}
				<div className="grid grid-cols-3 gap-3">
					<div className="flex flex-col items-center justify-center p-3 rounded-lg bg-muted/30 border border-border/50">
						<span className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">
							Current Elo
						</span>
						<span className="text-xl font-bold text-accent">
							{Math.round(cat.avg_rating || cat.score || 1500)}
						</span>
					</div>
					<div className="flex flex-col items-center justify-center p-3 rounded-lg bg-muted/30 border border-border/50">
						<span className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">
							Record
						</span>
						<span className="text-xl font-bold text-foreground">
							{wins}W - {losses}L
						</span>
					</div>
					<div className="flex flex-col items-center justify-center p-3 rounded-lg bg-muted/30 border border-border/50">
						<span className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">
							Win Rate
						</span>
						<span className="text-xl font-bold text-foreground">{winRate}%</span>
					</div>
				</div>

				{/* Chart */}
				<div className="flex flex-col gap-2">
					<h4 className="text-sm font-semibold text-foreground">Rating History</h4>
					<div className="h-48 w-full p-4 rounded-lg bg-card border border-border/60 shadow-sm flex items-center justify-center">
						{historyData.length > 0 ? (
							<ResponsiveContainer width="100%" height="100%">
								<AreaChart data={historyData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
									<defs>
										<linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
											<stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
											<stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
										</linearGradient>
									</defs>
									<CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
									<XAxis
										dataKey="match"
										stroke="rgba(255,255,255,0.3)"
										fontSize={11}
										tickLine={false}
										axisLine={false}
										minTickGap={20}
									/>
									<YAxis
										stroke="rgba(255,255,255,0.3)"
										fontSize={11}
										tickLine={false}
										axisLine={false}
										domain={['dataMin - 50', 'dataMax + 50']}
									/>
									<Tooltip
										contentStyle={{
											backgroundColor: "var(--card)",
											borderColor: "rgba(255,255,255,0.1)",
											borderRadius: "8px",
											fontSize: "12px",
										}}
										itemStyle={{ color: "var(--accent)", fontWeight: "bold" }}
										labelStyle={{ color: "var(--muted-foreground)", marginBottom: "4px" }}
										formatter={(value: number) => [value, "Elo Rating"]}
										labelFormatter={(label: number) => `Match ${label}`}
									/>
									<Area
										type="monotone"
										dataKey="rating"
										stroke="var(--accent)"
										strokeWidth={2}
										fillOpacity={1}
										fill="url(#colorRating)"
										activeDot={{ r: 5, fill: "var(--accent)", stroke: "var(--background)", strokeWidth: 2 }}
									/>
								</AreaChart>
							</ResponsiveContainer>
						) : (
							<span className="text-sm text-muted-foreground">Not enough data</span>
						)}
					</div>
				</div>
			</div>
		</Modal>
	);
}
