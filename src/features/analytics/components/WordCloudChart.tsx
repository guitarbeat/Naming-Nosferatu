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
                        const size = clamp(0.82 + (entry.avg_rating - 900) / 820, 0.82, 2.4);
                        const tone = index % 4 === 0 ? "text-primary" : index % 4 === 1 ? "text-white/80" : index % 4 === 2 ? "text-white/62" : "text-white/48";
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
                <div className="flex min-h-[22rem] flex-wrap items-center justify-center gap-x-3 gap-y-4 px-4 py-8 text-center sm:min-h-[26rem] sm:px-8 sm:py-10">
                        {items.map((item) => (
                                <span
                                        key={item.name}
                                        className={`font-semibold tracking-tight transition-transform duration-200 ${item.tone} hover:scale-105`}
                                        style={{ fontSize: `${item.size}rem`, lineHeight: 1.1 }}
                                        title={`${item.name} · ${Math.round(item.avg_rating)} avg · ${item.total_ratings} ratings`}
                                >
                                        {item.name}
                                </span>
                        ))}
                </div>
        );
}
