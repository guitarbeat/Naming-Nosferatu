import { api } from "@/services/apiClient";

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
	totalSelected?: number;
	totalSelections?: number;
	topName?: {
		id: string | number;
		name: string;
		rating: number;
		wins: number;
		selected: number;
		dateSubmitted: string | null;
	};
	totalNames?: number;
	hiddenNames?: number;
	activeNames?: number;
	totalUsers?: number;
	totalRatings?: number;
	neverSelectedCount?: number;
	neverSelectedNames?: string[];
}

export interface LeaderboardItem {
	name_id: string | number;
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
	getTopSelectedNames: async (limit: number | null = 20) => {
		try {
			return await api.get<{ name_id: string; name: string; times_selected: number }[]>(
				`/analytics/top-selections?limit=${limit || 20}`,
			);
		} catch {
			return [];
		}
	},

	getPopularityScores: async (
		limit: number | null = 20,
		userFilter: string | null = "all",
		currentUserName: string | null = null,
	) => {
		try {
			const params = new URLSearchParams();
			if (limit) {
				params.set("limit", String(limit));
			}
			if (userFilter) {
				params.set("userFilter", userFilter);
			}
			if (currentUserName) {
				params.set("currentUserName", currentUserName);
			}
			return await api.get<any[]>(`/analytics/popularity?${params}`);
		} catch {
			return [];
		}
	},

	getRankingHistory: async (
		topN = 10,
		periods = 7,
		options: { periods?: number; dateFilter?: string } = {},
	) => {
		try {
			const params = new URLSearchParams();
			params.set("topN", String(topN));
			params.set("periods", String(options?.periods ?? periods));
			if (options?.dateFilter) {
				params.set("dateFilter", options.dateFilter);
			}
			return await api.get<{ data: any[]; timeLabels: string[] }>(
				`/analytics/ranking-history?${params}`,
			);
		} catch {
			return { data: [], timeLabels: [] };
		}
	},
};

export const leaderboardAPI = {
	getLeaderboard: async (limit: number | null = 50) => {
		try {
			return await api.get<any[]>(`/analytics/leaderboard?limit=${limit || 50}`);
		} catch {
			return [];
		}
	},
};

export const statsAPI = {
	getSiteStats: async () => {
		try {
			return await api.get<any>("/analytics/site-stats");
		} catch {
			return null;
		}
	},

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
					user_wins: userRating?.wins || 0,
					user_losses: userRating?.losses || 0,
					has_user_rating: !!userRating,
					isHidden: item.is_hidden || false,
				};
			});
		} catch {
			return [];
		}
	},

	getUserStats: async (userName: string) => {
		try {
			return await api.get<any>(`/analytics/user-stats?userName=${encodeURIComponent(userName)}`);
		} catch {
			return null;
		}
	},
};
