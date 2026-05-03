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
			const size = clamp(1.6 + (entry.avg_rating - 900) / 280, 1.6, 5.2);
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
		<div className="flex min-h-[24rem] flex-wrap items-center justify-center gap-x-4 gap-y-5 px-4 py-8 text-center sm:min-h-[30rem] sm:px-8 sm:py-10">
			{items.map((item) => (
				<div key={item.name} className="group relative flex items-center justify-center">
					<span
						className={`cursor-default font-black tracking-tight transition-all duration-200 ${item.tone} group-hover:scale-110 group-hover:drop-shadow-[0_0_24px_rgba(255,255,255,0.22)]`}
						style={{ fontSize: `${item.size}rem`, lineHeight: 0.98 }}
						aria-label={`${item.name}: average rating ${Math.round(item.avg_rating)}, ${item.wins} wins, ${item.total_ratings} ratings`}
					>
						{item.name}
					</span>
					<div className="pointer-events-none absolute left-1/2 top-full z-20 mt-4 w-max -translate-x-1/2 translate-y-1 rounded-[1.25rem] border border-white/10 bg-slate-950/96 px-4 py-3 text-left text-[11px] leading-tight text-white opacity-0 shadow-[0_20px_50px_rgba(0,0,0,0.45)] transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100">
						<div className="text-sm font-semibold text-white">{item.name}</div>
						<div className="mt-1 text-white/72">Avg rating {Math.round(item.avg_rating)}</div>
						<div className="mt-1 flex gap-3 text-white/56">
							<span>{item.wins} wins</span>
							<span>{item.total_ratings} ratings</span>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
