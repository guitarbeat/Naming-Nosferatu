interface WordCloudChartProps {
        leaderboard: Array<{
                name: string;
                avg_rating: number;
                wins: number;
                total_ratings: number;
        }>;
        limit?: number;
}

function clamp(value: number, min: number, max: number) {
        return Math.min(max, Math.max(min, value));
}

export function WordCloudChart({ leaderboard, limit = 12 }: WordCloudChartProps) {
        const items = [...leaderboard]
                .sort((a, b) => b.avg_rating - a.avg_rating)
                .slice(0, limit)
                .map((entry, index) => {
                        const size = clamp(0.9 + (entry.avg_rating - 1000) / 700, 0.9, 2.2);
                        const tone = index % 3 === 0 ? "text-primary" : index % 3 === 1 ? "text-white/80" : "text-white/55";
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
                <div className="flex min-h-[18rem] flex-wrap items-center justify-center gap-x-3 gap-y-4 px-2 py-4 text-center">
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
