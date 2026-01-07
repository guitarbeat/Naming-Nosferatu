// Shared types for Analysis Dashboard components

/**
 * Types with snake_case properties match database column names from Supabase queries.
 * These cannot be changed to camelCase without breaking database queries.
 */

export interface NameWithInsight {
	id: string | number;
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
		id: string | number;
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

/**
 * Database query result type - field names match Supabase column names (snake_case required)
 */
export interface LeaderboardItem {
	// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
	name_id: string | number;
	name: string;
	// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
	avg_rating?: number;
	wins?: number;
	// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
	created_at?: string | null;
	// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
	date_submitted?: string | null;
}

/**
 * Database query result type - field names match Supabase column names (snake_case required)
 */
export interface SelectionPopularityItem {
	// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
	name_id: string | number;
	name: string;
	// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
	times_selected?: number;
	// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
	created_at?: string | null;
	// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
	date_submitted?: string | null;
}

/**
 * Database query result type - field names match Supabase column names (snake_case required)
 */
export interface AnalyticsDataItem {
	// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
	name_id: string | number;
	name: string;
	// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
	avg_rating?: number;
	// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
	total_wins?: number;
	// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
	times_selected?: number;
	// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
	created_at?: string | null;
	// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
	date_submitted?: string | null;
}

export interface HighlightItem {
	id: string;
	name: string;
	value?: number;
	// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
	avg_rating?: number;
}

export interface ConsolidatedName {
	id: string | number;
	name: string;
	rating: number;
	wins: number;
	selected: number;
	dateSubmitted: string | null;
	insights?: string[];
	ratingPercentile?: number;
	selectedPercentile?: number;
	[key: string]: unknown;
}

export interface AnalysisDashboardProps {
	highlights?: { topRated?: HighlightItem[]; mostWins?: HighlightItem[] };
	userName?: string | null;
	showGlobalLeaderboard?: boolean;
	defaultCollapsed?: boolean;
	isAdmin?: boolean;
	onNameHidden?: (id: string) => void;
}
