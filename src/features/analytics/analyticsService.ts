/**
 * @module analyticsService
 * @description Analytics service and shared types for analysis dashboard
 */

import { api } from "@/services/apiClient";

/* ==========================================================================
   SHARED ANALYTICS TYPES
   ========================================================================== */

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
	name_id: string | number;
	name: string;
	avg_rating?: number;
	wins?: number;
	created_at?: string | null;
	date_submitted?: string | null;
}

/**
 * Database query result type - field names match Supabase column names (snake_case required)
 */
export interface SelectionPopularityItem {
	name_id: string | number;
	name: string;
	times_selected?: number;
	created_at?: string | null;
	date_submitted?: string | null;
}

/**
 * Database query result type - field names match Supabase column names (snake_case required)
 */
export interface AnalyticsDataItem {
	name_id: string | number;
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

export const analyticsAPI = {
	/**
	 * Get top selected names based on selection history
	 */
	getTopSelectedNames: async (limit: number | null = 20) => {
		try {
			return await api.get<any[]>(`/analytics/top-selections?limit=${limit || 20}`);
		} catch {
			return [];
		}
	},

	/**
	 * Get comprehensive popularity scores with weighting
	 */
	getPopularityScores: async (
		limit: number | null = 20,
		userFilter: string | null = "all",
		currentUserName: string | null = null,
	) => {
		try {
			const query = new URLSearchParams();
			if (limit) query.append("limit", String(limit));
			if (userFilter) query.append("userFilter", userFilter);
			if (currentUserName) query.append("currentUserName", currentUserName);
			return await api.get<any[]>(`/analytics/popularity?${query.toString()}`);
		} catch {
			return [];
		}
	},

	/**
	 * Get ranking history for bump chart
	 */
	getRankingHistory: async (
		topN = 10,
		periods = 7,
		options: { periods?: number; dateFilter?: string } = {},
	) => {
		try {
			const query = new URLSearchParams();
			query.append("topN", String(topN));
			query.append("periods", String(options.periods || periods));
			if (options.dateFilter) query.append("dateFilter", options.dateFilter);

			return await api.get<any>(`/analytics/ranking-history?${query.toString()}`);
		} catch {
			return { data: [], timeLabels: [] };
		}
	},
};

export const leaderboardAPI = {
	/**
	 * Get leaderboard data
	 */
	getLeaderboard: async (limit: number | null = 50) => {
		try {
			return await api.get<any[]>(`/analytics/leaderboard?limit=${limit || 50}`);
		} catch {
			return [];
		}
	},
};

export const statsAPI = {
	/**
	 * Get global site statistics
	 */
	getSiteStats: async () => {
		try {
			return await api.get<any>("/analytics/site-stats");
		} catch {
			return null;
		}
	},

	/**
	 * Get all names with user-specific ratings
	 */
	getUserRatedNames: async (userName: string) => {
		try {
			const [names, ratings] = await Promise.all([
				api.get<any[]>("/names?includeHidden=false"),
				api.get<any[]>(`/analytics/ratings-raw?userName=${encodeURIComponent(userName)}`),
			]);

			const ratingMap = new Map<string, any>();
			for (const r of ratings) {
				ratingMap.set(String(r.nameId), r);
			}

			return (names || []).map((item: any) => {
				const userRating = ratingMap.get(String(item.id));
				return {
					...item,
					user_rating: userRating ? Number(userRating.rating) : null,
					user_wins: userRating ? Number(userRating.wins) : 0,
					user_losses: userRating ? Number(userRating.losses) : 0,
					has_user_rating: !!userRating,
					isHidden: item.is_hidden || false,
				};
			});
		} catch {
			return [];
		}
	},

	/**
	 * Get comprehensive user statistics
	 */
	getUserStats: async (userName: string) => {
		try {
			return await api.get<any>(`/analytics/user-stats?userName=${encodeURIComponent(userName)}`);
		} catch {
			return null;
		}
	},
};
