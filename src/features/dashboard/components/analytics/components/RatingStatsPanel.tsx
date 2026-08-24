import type { RatingStats } from "@/shared/lib/ratingStats";

interface RatingStatsPanelProps {
	stats: RatingStats | null;
}

export function RatingStatsPanel({ stats }: RatingStatsPanelProps) {
	if (!stats) {
		return null;
	}

	return (
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
	);
}
