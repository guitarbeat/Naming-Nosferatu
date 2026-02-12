/**
 * @module metrics
 * @description Metrics calculation and rating data transformation utilities
 */

const METRIC_LABELS: Record<string, string> = {
	rating: "Rating",
	total_wins: "Wins",
	selected: "Selected",
	avg_rating: "Avg Rating",
	wins: "Wins",
	dateSubmitted: "Date Added",
};

/**
 * Get a human-readable label for a metric key
 */
export function getMetricLabel(metricKey: string): string {
	return METRIC_LABELS[metricKey] || metricKey;
}

/**
 * Calculate the percentile rank of a value within a dataset
 */
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

/**
 * Convert ratings object/array to standardized array format
 */
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

/**
 * Convert ratings array to object format
 */
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
