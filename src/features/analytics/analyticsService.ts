/**
 * @module analyticsService
 * @description Analytics service and shared types for analysis dashboard
 */

import { withSupabase } from "@/services/supabase/client";

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
	description?: string | null;
	category?: string | null;
	avg_rating?: number;
	total_ratings?: number;
	wins?: number;
	losses?: number;
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

/* ==========================================================================
   INTERNAL SERVICE TYPES
   ========================================================================== */

interface RatingInfo {
	rating: number;
	wins: number;
}

interface SelectionRow {
	name_id: string | number;
	name: string;
	user_name: string;
	selected_at: string;
}

interface RatingRow {
	name_id: string | number;
	rating: number;
	wins: number;
	losses: number;
	user_name: string;
}

export const analyticsAPI = {
	/**
	 * Get top selected names based on selection history
	 */
	getTopSelectedNames: async (limit: number | null = 20) => {
		return withSupabase(async (client) => {
			const { data, error } = await client.rpc("get_top_selections", {
				limit_count: limit || 20,
			});

			if (error) {
				console.error("Error fetching top selections:", error);
				return [];
			}

			return (data || []).map((item) => ({
				name_id: String(item.name_id),
				name: item.name,
				times_selected: Number(item.times_selected),
			}));
		}, []);
	},

	/**
	 * Get comprehensive popularity scores with weighting
	 */
	getPopularityScores: async (
		limit: number | null = 20,
		userFilter: string | null = "all",
		currentUserName: string | null = null,
	) => {
		return withSupabase(async (client) => {
			const { data, error } = await client.rpc("get_popularity_scores", {
				limit_count: limit || 20,
				user_filter: userFilter || "all",
				current_user_name: currentUserName,
			});

			if (error) {
				console.error("Error fetching popularity scores:", error);
				return [];
			}

			return (data || []).map((item) => ({
				name_id: String(item.name_id),
				name: item.name,
				description: item.description,
				category: item.category,
				times_selected: Number(item.times_selected),
				avg_rating: Number(item.avg_rating),
				popularity_score: Number(item.popularity_score),
				created_at: item.created_at,
			}));
		}, []);
	},

	/**
	 * Get ranking history for bump chart
	 */
	getRankingHistory: async (
		topN = 10,
		periods = 7,
		options: { periods?: number; dateFilter?: string } = {},
	) => {
		return withSupabase(
			async (client) => {
				const dateFilterPeriods = {
					today: 2,
					week: 7,
					month: 30,
					year: 365,
					all: periods,
				};
				const dateFilterKey = options?.dateFilter as keyof typeof dateFilterPeriods;
				const requestedPeriods =
					options?.periods ??
					(dateFilterKey ? dateFilterPeriods[dateFilterKey] : undefined) ??
					periods;
				const periodCount = Math.max(requestedPeriods, 2);

				const startDate = new Date();
				startDate.setDate(startDate.getDate() - (periodCount - 1));

				const { data: selections, error: selError } = await client
					// biome-ignore lint/suspicious/noExplicitAny: Database schema dynamic
					.from("cat_tournament_selections" as any)
					.select("name_id, name, selected_at")
					.gte("selected_at", startDate.toISOString())
					.order("selected_at", { ascending: true });

				if (selError) {
					console.error("Error fetching selection history:", selError);
					return { data: [], timeLabels: [] };
				}

				const typedSelections = selections as unknown as SelectionRow[];

				const { data: ratings } = await client
					.from("cat_name_ratings")
					.select("name_id, rating, wins");

				const ratingMap = new Map<string, RatingInfo>();
				(ratings || []).forEach((r) => {
					const row = r as RatingRow;
					const nameId = String(row.name_id);
					const existing = ratingMap.get(nameId);
					if (!existing || (row.rating && row.rating > existing.rating)) {
						ratingMap.set(nameId, {
							rating: row.rating || 1500,
							wins: row.wins || 0,
						});
					}
				});

				const dateGroups = new Map<string, Map<string, { name: string; count: number }>>();
				const nameData = new Map<
					string,
					{
						id: string;
						name: string;
						avgRating: number;
						totalSelections: number;
					}
				>();

				typedSelections.forEach((item) => {
					const s = item;
					const nameId = String(s.name_id);
					const dateStr = new Date(s.selected_at).toISOString();
					const [date] = dateStr.split("T");
					if (!date || !dateGroups.has(date)) {
						dateGroups.set(date || "unknown", new Map());
					}
					const dayMap = dateGroups.get(date || "unknown");
					if (!dayMap) {
						return;
					}

					if (!dayMap.has(nameId)) {
						dayMap.set(nameId, { name: s.name, count: 0 });
					}
					const dayData = dayMap.get(nameId);
					if (dayData) {
						dayData.count += 1;
					}

					if (!nameData.has(nameId)) {
						const ratingInfo = ratingMap.get(nameId) || {
							rating: 1500,
							wins: 0,
						};
						nameData.set(nameId, {
							id: nameId,
							name: s.name,
							avgRating: ratingInfo.rating,
							totalSelections: 0,
						});
					}
					const ns = nameData.get(nameId);
					if (ns) {
						ns.totalSelections += 1;
					}
				});

				const timeLabels: string[] = [];
				const today = new Date();
				for (let i = periodCount - 1; i >= 0; i--) {
					const d = new Date(today);
					d.setDate(d.getDate() - i);
					timeLabels.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
				}

				const dateKeys: string[] = [];
				for (let i = periodCount - 1; i >= 0; i--) {
					const d = new Date(today);
					d.setDate(d.getDate() - i);
					dateKeys.push(d.toISOString().split("T")[0] || "");
				}

				const sortedNames = Array.from(nameData.values())
					.sort((a, b) => b.totalSelections - a.totalSelections)
					.slice(0, topN);

				const rankingData = sortedNames.map((nameInfo) => {
					const rankings = dateKeys.map((dateKey) => {
						const dayData = dateGroups.get(dateKey);
						if (!dayData) {
							return null;
						}

						const dayEntries = Array.from(dayData.entries()).sort(
							(a, b) => b[1].count - a[1].count,
						);
						const rankIndex = dayEntries.findIndex(([id]) => id === nameInfo.id);
						return rankIndex >= 0 ? rankIndex + 1 : null;
					});

					return {
						id: nameInfo.id,
						name: nameInfo.name,
						rankings,
						avgRating: nameInfo.avgRating,
						totalSelections: nameInfo.totalSelections,
					};
				});

				return { data: rankingData, timeLabels };
			},
			{ data: [], timeLabels: [] },
		);
	},
};

export const leaderboardAPI = {
	/**
	 * Get leaderboard data using efficient RPC
	 */
	getLeaderboard: async (limit: number | null = 50) => {
		return withSupabase(async (client) => {
			const { data, error } = await client.rpc("get_leaderboard_stats", {
				limit_count: limit || 50,
			});

			if (error) {
				console.error("Error fetching leaderboard:", error);
				return [];
			}

			// Map RPC result to match LeaderboardItem interface
			return (data || []).map((item) => ({
				name_id: item.name_id,
				name: item.name,
				description: item.description,
				category: item.category,
				avg_rating: Number(item.avg_rating),
				total_ratings: Number(item.total_ratings),
				wins: Number(item.wins),
				losses: Number(item.losses),
				created_at: item.created_at,
				// Derived fields
				date_submitted: item.created_at,
			}));
		}, []);
	},
};

export const statsAPI = {
	/**
	 * Get global site statistics
	 */
	getSiteStats: async () => {
		return withSupabase(async (client) => {
			const { data, error } = await client.rpc("get_site_stats");

			if (error) {
				console.error("Error fetching site stats:", error);
				return null;
			}

			// RPC returns a single object
			const stats = Array.isArray(data) ? data[0] : data;

			return {
				totalNames: Number(stats.total_names),
				hiddenNames: Number(stats.hidden_names),
				activeNames: Number(stats.active_names),
				totalUsers: Number(stats.total_users),
				totalRatings: Number(stats.total_ratings),
				totalSelections: Number(stats.total_selections),
				avgRating: Number(stats.avg_rating),
			};
		}, null);
	},

	/**
	 * Get all names with user-specific ratings
	 */
	getUserRatedNames: async (userName: string) => {
		return withSupabase(async (client) => {
			const { data, error } = await client
				.from("cat_name_options")
				.select("*, cat_name_ratings!left (*)")
				.eq("is_active", true)
				.eq("cat_name_ratings.user_name", userName);
			if (error) {
				return [];
			}

			return (data || []).map((item) => {
				const ratingsList = item.cat_name_ratings;
				const userRating = Array.isArray(ratingsList)
					? ratingsList[0]
					: (ratingsList as RatingRow | null);
				return {
					...item,
					user_rating: userRating?.rating || null,
					user_wins: userRating?.wins || 0,
					user_losses: userRating?.losses || 0,
					has_user_rating: !!userRating,
					isHidden: item.is_hidden || false,
				};
			});
		}, []);
	},

	/**
	 * Get comprehensive user statistics
	 */
	getUserStats: async (userName: string) => {
		return withSupabase(async (client) => {
			const [ratingsResult, selectionsResult] = await Promise.all([
				client.from("cat_name_ratings").select("*").eq("user_name", userName),
				client
					.from("cat_tournament_selections" as any)
					.select("*")
					.eq("user_name", userName),
			]);

			const ratings = ratingsResult.data || [];
			const selections = selectionsResult.data || [];
			const totalWins = ratings.reduce((sum, r) => sum + (r.wins || 0), 0);
			const totalLosses = ratings.reduce((sum, r) => sum + (r.losses || 0), 0);

			return {
				userName,
				totalRatings: ratings.length,
				totalSelections: selections.length,
				totalWins,
				totalLosses,
				winRate:
					totalWins + totalLosses > 0
						? Math.round((totalWins / (totalWins + totalLosses)) * 100)
						: 0,
				avgUserRating:
					ratings.length > 0
						? Math.round(ratings.reduce((sum, r) => sum + (r.rating || 1500), 0) / ratings.length)
						: 1500,
			};
		}, null);
	},
};
