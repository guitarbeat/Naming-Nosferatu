interface WordCloudChartProps {
	leaderboard: Array<{
		name: string;
		avg_rating: number;
		wins: number;
		total_ratings: number;
	}>;
}

function clamp(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value));
}

interface TooltipProps {
	name: string;
	avgRating: number;
	wins: number;
	totalRatings: number;
}

function WordTooltip({ name, avgRating, wins, totalRatings }: TooltipProps) {
	const winRate = totalRatings > 0 ? Math.round((wins / totalRatings) * 100) : 0;
	return (
		<div className="pointer-events-none absolute left-1/2 top-full z-30 mt-3 -translate-x-1/2 translate-y-1 opacity-0 transition-all duration-200 ease-out group-hover:translate-y-0 group-hover:opacity-100">
			{/* Caret */}
			<div className="mx-auto mb-[-1px] h-0 w-0 border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent border-b-border/50" />
			<div className="surface-panel min-w-[148px] rounded-[1.1rem] px-3.5 py-3 text-left shadow-lg">
				<p className="mb-2 text-[13px] font-bold leading-none tracking-tight text-foreground">{name}</p>
				<div className="mb-2 h-px bg-border/40" />
				<div className="flex flex-col gap-1.5">
					<div className="flex items-center justify-between gap-6">
						<span className="text-[11px] text-muted-foreground/70">Avg rating</span>
						<span className="text-[11px] font-semibold tabular-nums text-foreground/90">
							{Math.round(avgRating)}
						</span>
					</div>
					<div className="flex items-center justify-between gap-6">
						<span className="text-[11px] text-muted-foreground/70">Wins</span>
						<span className="text-[11px] font-semibold tabular-nums text-foreground/90">{wins}</span>
					</div>
					<div className="flex items-center justify-between gap-6">
						<span className="text-[11px] text-muted-foreground/70">Win rate</span>
						<span className="text-[11px] font-semibold tabular-nums text-foreground/90">{winRate}%</span>
					</div>
				</div>
			</div>
		</div>
	);
}

export function WordCloudChart({ leaderboard }: WordCloudChartProps) {
	const items = [...leaderboard]
		.sort((a, b) => b.avg_rating - a.avg_rating)
		.map((entry, index) => {
			const size = clamp(1.8 + (entry.avg_rating - 900) / 230, 1.8, 5.8);
			const tone =
				index % 5 === 0
					? "text-primary"
					: index % 5 === 1
						? "text-foreground/95"
						: index % 5 === 2
							? "text-foreground/82"
							: index % 5 === 3
								? "text-foreground/68"
								: "text-muted-foreground/75";
			return { ...entry, size, tone };
		});

	if (items.length === 0) {
		return null;
	}

	return (
		<div className="flex min-h-[26rem] flex-wrap items-center justify-center gap-x-2 gap-y-3 px-3 py-6 text-center sm:min-h-[32rem] sm:px-6 sm:py-8">
			{items.map((item) => (
				<div key={item.name} className="group relative flex items-center justify-center px-1 py-1">
					<span
						className={`cursor-default font-black tracking-tight transition-all duration-200 ${item.tone} group-hover:scale-110 group-hover:drop-shadow-[0_0_28px_rgba(255,255,255,0.26)]`}
						style={{ fontSize: `${item.size}rem`, lineHeight: 0.92 }}
						aria-label={`${item.name}: average rating ${Math.round(item.avg_rating)}, ${item.wins} wins, ${item.total_ratings} ratings`}
					>
						{item.name}
					</span>
					<WordTooltip
						name={item.name}
						avgRating={item.avg_rating}
						wins={item.wins}
						totalRatings={item.total_ratings}
					/>
				</div>
			))}
		</div>
	);
}
