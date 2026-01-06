export interface InsightCategory {
	label: string;
	description: string;
	icon: string;
	color: string;
}

// Category keys use snake_case to match insight tag strings used throughout the codebase
const INSIGHT_CATEGORIES: Record<string, InsightCategory> = {
	// biome-ignore lint/style/useNamingConvention: Keys must match insight tag strings exactly
	top_rated: {
		label: "Top Rated",
		description: "In the top 10% by rating",
		icon: "⭐",
		color: "var(--color-gold, #f59e0b)",
	},
	// biome-ignore lint/style/useNamingConvention: Keys must match insight tag strings exactly
	trending_up: {
		label: "Trending Up",
		description: "Gaining popularity",
		icon: "📈",
		color: "var(--color-success, #22c55e)",
	},
	// biome-ignore lint/style/useNamingConvention: Keys must match insight tag strings exactly
	trending_down: {
		label: "Trending Down",
		description: "Losing popularity",
		icon: "📉",
		color: "var(--color-danger, #ef4444)",
	},
	// biome-ignore lint/style/useNamingConvention: Keys must match insight tag strings exactly
	most_selected: {
		label: "Most Selected",
		description: "One of the top selections",
		icon: "👍",
		color: "var(--color-info, #3b82f6)",
	},
	underrated: {
		label: "Underrated",
		description: "Good rating but low selections",
		icon: "💎",
		color: "var(--color-purple, #a855f7)",
	},
	new: {
		label: "New",
		description: "Recently added",
		icon: "✨",
		color: "var(--color-cyan, #06b6d4)",
	},
	undefeated: {
		label: "Undefeated",
		description: "No losses yet",
		icon: "🏆",
		color: "var(--color-gold, #f59e0b)",
	},
	undiscovered: {
		label: "Undiscovered",
		description: "Never selected yet",
		icon: "🔍",
		color: "var(--color-subtle, #6b7280)",
	},
};

export function getInsightCategory(categoryKey: string): InsightCategory | null {
	return INSIGHT_CATEGORIES[categoryKey] || null;
}

// Metric keys match database field names and internal metric identifiers
const METRIC_LABELS: Record<string, string> = {
	rating: "Rating",
	// biome-ignore lint/style/useNamingConvention: Database field name must match exactly
	total_wins: "Wins",
	selected: "Selected",
	// biome-ignore lint/style/useNamingConvention: Database field name must match exactly
	avg_rating: "Avg Rating",
	wins: "Wins",
	dateSubmitted: "Date Added",
};

export function getMetricLabel(metricKey: string): string {
	return METRIC_LABELS[metricKey] || metricKey;
}

export function calculatePercentile(
	value: number,
	allValues: number[],
	higherIsBetter = true,
): number {
	if (!allValues || allValues.length === 0) {
		return 50;
	}

	const validValues = allValues.filter((v) => v != null && !Number.isNaN(v));
	if (validValues.length === 0) {
		return 50;
	}

	const sorted = [...validValues].sort((a, b) => a - b);

	if (higherIsBetter) {
		const belowCount = sorted.filter((v) => v < value).length;
		return Math.round((belowCount / sorted.length) * 100);
	} else {
		const aboveCount = sorted.filter((v) => v > value).length;
		return Math.round((aboveCount / sorted.length) * 100);
	}
}

export interface RatingData {
	rating: number;
	wins: number;
	losses: number;
}

export interface RatingItem extends RatingData {
	name: string;
}

export interface RatingDataInput {
	rating: number;
	wins?: number;
	losses?: number;
}

export function ratingsToArray(
	ratings: Record<string, RatingDataInput | number> | RatingItem[],
): RatingItem[] {
	if (Array.isArray(ratings)) {
		return ratings;
	}

	return Object.entries(ratings).map(([name, data]) => ({
		name,
		rating: typeof data === "number" ? data : (data as RatingDataInput)?.rating || 1500,
		wins: typeof data === "object" ? (data as RatingDataInput)?.wins || 0 : 0,
		losses: typeof data === "object" ? (data as RatingDataInput)?.losses || 0 : 0,
	}));
}

export function ratingsToObject(ratingsArray: RatingItem[]): Record<string, RatingData> {
	if (!Array.isArray(ratingsArray)) {
		return {};
	}

	return ratingsArray.reduce(
		(acc, item) => {
			acc[item.name] = {
				rating: item.rating || 1500,
				wins: item.wins || 0,
				losses: item.losses || 0,
			};
			return acc;
		},
		{} as Record<string, RatingData>,
	);
}
