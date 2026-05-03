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

export function WordCloudChart({ leaderboard }: WordCloudChartProps) {
	const items = [...leaderboard]
		.sort((a, b) => b.avg_rating - a.avg_rating)
		.map((entry, index) => {
			const size = clamp(1.8 + (entry.avg_rating - 900) / 230, 1.8, 5.8);
			const tone =
				index % 5 === 0
					? "text-primary"
					: index % 5 === 1
						? "text-white/95"
						: index % 5 === 2
							? "text-white/82"
							: index % 5 === 3
								? "text-white/68"
								: "text-white/54";
			return {
				...entry,
				size,
				tone,
			};
		});

	if (items.length === 0) {
		return null;
	}

	return (
		<div className="flex min-h-[26rem] flex-wrap items-center justify-center gap-x-2 gap-y-2 px-3 py-6 text-center sm:min-h-[32rem] sm:px-6 sm:py-8">
			{items.map((item) => (
				<div key={item.name} className="group relative flex items-center justify-center px-1 py-1">
					<span
						className={`cursor-default font-black tracking-tight transition-all duration-200 ${item.tone} group-hover:scale-110 group-hover:drop-shadow-[0_0_28px_rgba(255,255,255,0.26)]`}
						style={{ fontSize: `${item.size}rem`, lineHeight: 0.92 }}
						aria-label={`${item.name}: average rating ${Math.round(item.avg_rating)}, ${item.wins} wins, ${item.total_ratings} ratings`}
					>
						{item.name}
					</span>
					<div className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 translate-y-1 opacity-0 transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100">
						<div className="relative rounded-[1.15rem] border border-white/12 bg-slate-950/98 px-3.5 py-2.5 text-left text-[11px] leading-tight text-white shadow-[0_18px_48px_rgba(0,0,0,0.5)]">
							<div className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-l border-t border-white/12 bg-slate-950/98" />
							<div className="text-sm font-semibold text-white">{item.name}</div>
							<div className="mt-1 text-white/72">Avg rating {Math.round(item.avg_rating)}</div>
							<div className="mt-1 flex gap-3 text-white/56">
								<span>{item.wins} wins</span>
								<span>{item.total_ratings} ratings</span>
							</div>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
