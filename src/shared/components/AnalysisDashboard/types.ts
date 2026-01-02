// Shared types for Analysis Dashboard components

export interface NameWithInsight {
	id: string;
	name: string;
	rating: number;
	wins: number;
	selected: number;
	dateSubmitted: string | null;
	insights: string[];
	ratingPercentile?: number;
	selectedPercentile?: number;
}

export interface SummaryStats {
	maxRating?: number;
	maxWins?: number;
	maxSelected?: number;
	avgRating: number;
	avgWins?: number;
	totalSelected?: number; // User view
	totalSelections?: number; // Admin view
	topName?: {
		id: string;
		name: string;
		rating: number;
		wins: number;
		selected: number;
		dateSubmitted: string | null;
	};
	// Admin specific
	totalNames?: number;
	hiddenNames?: number;
	activeNames?: number;
	totalUsers?: number;
	totalRatings?: number;
	neverSelectedCount?: number;
	neverSelectedNames?: string[];
}

export interface LeaderboardItem {
	name_id: string;
	name: string;
	avg_rating?: number;
	wins?: number;
	created_at?: string | null;
	date_submitted?: string | null;
}

export interface SelectionPopularityItem {
	name_id: string | number;
	name: string;
	times_selected?: number;
	created_at?: string | null;
	date_submitted?: string | null;
}

export interface AnalyticsDataItem {
	name_id: string;
	name: string;
	avg_rating?: number;
	total_wins?: number;
	times_selected?: number;
	created_at?: string | null;
	date_submitted?: string | null;
}

export interface HighlightItem {
	id: string;
	name: string;
	value?: number;
	avg_rating?: number;
}
