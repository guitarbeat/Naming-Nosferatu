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
			const size = clamp(1.25 + (entry.avg_rating - 900) / 420, 1.25, 4.2);
			const tone = index % 4 === 0 ? "text-primary" : index % 4 === 1 ? "text-white/88" : index % 4 === 2 ? "text-white/72" : "text-white/58";
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
		<div className="flex min-h-[24rem] flex-wrap items-center justify-center gap-x-3 gap-y-4 px-4 py-8 text-center sm:min-h-[30rem] sm:px-8 sm:py-10">
			{items.map((item) => (
				<div key={item.name} className="group relative">
					<span
						className={`cursor-default font-semibold tracking-tight transition-transform duration-200 ${item.tone} group-hover:scale-110 group-hover:drop-shadow-[0_0_18px_rgba(255,255,255,0.22)]`}
						style={{ fontSize: `${item.size}rem`, lineHeight: 1.05 }}
						aria-label={`${item.name}: average rating ${Math.round(item.avg_rating)}, ${item.wins} wins, ${item.total_ratings} ratings`}
					>
						{item.name}
					</span>
					<div className="pointer-events-none absolute left-1/2 top-full z-20 mt-3 w-max -translate-x-1/2 rounded-2xl border border-white/15 bg-slate-950/95 px-3 py-2 text-left text-[11px] leading-tight text-white opacity-0 shadow-[0_16px_40px_rgba(0,0,0,0.35)] transition-all duration-150 group-hover:opacity-100">
						<div className="font-semibold text-white">{item.name}</div>
						<div className="mt-1 text-white/70">Avg {Math.round(item.avg_rating)} · {item.wins} wins</div>
						<div className="text-white/55">{item.total_ratings} ratings</div>
					</div>
				</div>
			))}
		</div>
	);
}
