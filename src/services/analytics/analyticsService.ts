/**
 * @module analyticsService
 * @description Analytics data service and shared types for the analysis dashboard.
 *
 * Exports three API namespaces:
 * - `analyticsAPI`  — selection popularity, popularity scores, ranking history
 * - `leaderboardAPI` — global leaderboard rankings
 * - `statsAPI` — site-wide statistics and user-specific stats
 *
 * All queries go through `withSupabase`, which handles client resolution and
 * returns a typed fallback on failure.
 *
 * ## Snake_case fields
 *
 * Types with `snake_case` properties (`name_id`, `avg_rating`, `created_at`,
 * etc.) mirror Supabase column names. They cannot be renamed without updating
 * the corresponding database views/tables.
 */

import { withSupabase } from "@/services/supabase-client/client";

// ═══════════════════════════════════════════════════════════════════════════════
// Public Types (used by hooks and UI components)
// ═══════════════════════════════════════════════════════════════════════════════

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

/** Database leaderboard row — field names match Supabase columns. */
export interface LeaderboardItem {
	name_id: string | number;
	name: string;
	avg_rating?: number;
	wins?: number;
	created_at?: string | null;
	date_submitted?: string | null;
}

/** Database selection popularity row. */
export interface SelectionPopularityItem {
	name_id: string | number;
	name: string;
	times_selected?: number;
	created_at?: string | null;
	date_submitted?: string | null;
}

/** Database analytics row (admin view). */
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

export interface AnalysisDashboardProps {
	highlights?: { topRated?: HighlightItem[]; mostWins?: HighlightItem[] };
	userName?: string | null;
	showGlobalLeaderboard?: boolean;
	defaultCollapsed?: boolean;
	isAdmin?: boolean;
	onNameHidden?: (id: string) => void;
}

export interface GeneralInsight {
	type: string;
	message: string;
	icon: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Internal Row Types (match raw Supabase query results)
// ═══════════════════════════════════════════════════════════════════════════════

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

interface SiteStatsRpcResult {
	totalNames: number;
	hiddenNames: number;
	activeNames: number;
	totalUsers: number;
	totalRatings: number;
	totalSelections: number;
	avgRating: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// analyticsAPI
// ═══════════════════════════════════════════════════════════════════════════════

export const analyticsAPI = {
	/** Get top selected names based on selection history. */
	getTopSelectedNames: async (limit: number | null = 20) => {
		return withSupabase(async (client) => {
			const { data, error } = await client.rpc("get_top_selections", {
				limit_count: limit || 20,
			});

			if (error || !data) {
				return [];
			}

			return (data as unknown as { name_id: string; name: string; count: number }[]).map(
				(item) => ({
					name_id: String(item.name_id),
					name: item.name,
					times_selected: item.count,
				}),
			);
		}, []);
	},

	/** Get comprehensive popularity scores with weighting. */
	getPopularityScores: async (
		limit: number | null = 20,
		userFilter: string | null = "all",
		currentUserName: string | null = null,
	) => {
		return withSupabase(async (client) => {
			const { data, error } = await client.rpc("get_popularity_scores", {
				p_limit: limit,
				p_user_filter: userFilter,
				p_current_user_name: currentUserName,
			});

			if (error) {
				console.error("Error fetching popularity scores:", error);
				return [];
			}

			return (data || []).map((item: any) => ({
				name_id: item.name_id,
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

	/** Get ranking history for bump charts. */
	getRankingHistory: async (
		topN = 10,
		periods = 7,
		options: { periods?: number; dateFilter?: string } = {},
	) => {
		type Result = {
			data: Array<{
				id: string;
				name: string;
				rankings: (number | null)[];
				avgRating: number;
				totalSelections: number;
			}>;
			timeLabels: string[];
		};

		return withSupabase<Result>(
			async (client) => {
				const dateFilterPeriods: Record<string, number> = {
					today: 2,
					week: 7,
					month: 30,
					year: 365,
				};

				const periodCount = Math.max(
					options.periods ??
						(options.dateFilter ? (dateFilterPeriods[options.dateFilter] ?? periods) : periods),
					2,
				);

				const startDate = new Date();
				startDate.setDate(startDate.getDate() - (periodCount - 1));

				const { data: selections, error: selError } = (await client
					.from("cat_tournament_selections")
					.select("name_id, name, selected_at")
					.gte("selected_at", startDate.toISOString())
					.order("selected_at", { ascending: true })) as unknown as {
					data: SelectionRow[] | null;
					error: unknown;
				};

				if (selError || !selections) {
					return { data: [], timeLabels: [] };
				}

				const { data: ratings } = (await client
					.from("cat_name_ratings")
					.select("name_id, rating, wins")) as unknown as {
					data: RatingRow[] | null;
					error: unknown;
				};

				// Build rating lookup (highest rating per name)
				const ratingMap = new Map<string, { rating: number; wins: number }>();
				for (const r of ratings ?? []) {
					const id = String(r.name_id);
					const existing = ratingMap.get(id);
					if (!existing || r.rating > existing.rating) {
						ratingMap.set(id, { rating: r.rating || 1500, wins: r.wins || 0 });
					}
				}

				// Group selections by date
				const dateGroups = new Map<string, Map<string, { name: string; count: number }>>();
				const nameData = new Map<
					string,
					{ id: string; name: string; avgRating: number; totalSelections: number }
				>();

				for (const s of selections) {
					const nameId = String(s.name_id);
					const date = new Date(s.selected_at).toISOString().split("T")[0] ?? "unknown";

					if (!dateGroups.has(date)) {
						dateGroups.set(date, new Map());
					}
					const dayMap = dateGroups.get(date);
					if (dayMap) {
						const dayEntry = dayMap.get(nameId);
						if (dayEntry) {
							dayEntry.count += 1;
						} else {
							dayMap.set(nameId, { name: s.name, count: 1 });
						}
					}

					if (!nameData.has(nameId)) {
						const info = ratingMap.get(nameId) ?? { rating: 1500, wins: 0 };
						nameData.set(nameId, {
							id: nameId,
							name: s.name,
							avgRating: info.rating,
							totalSelections: 0,
						});
					}
					const nameEntry = nameData.get(nameId);
					if (nameEntry) {
						nameEntry.totalSelections += 1;
					}
				}

				// Build time labels and date keys
				const today = new Date();
				const timeLabels: string[] = [];
				const dateKeys: string[] = [];
				for (let i = periodCount - 1; i >= 0; i--) {
					const d = new Date(today);
					d.setDate(d.getDate() - i);
					timeLabels.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
					dateKeys.push(d.toISOString().split("T")[0] ?? "");
				}

				// Build ranking data
				const sortedNames = Array.from(nameData.values())
					.sort((a, b) => b.totalSelections - a.totalSelections)
					.slice(0, topN);

				const rankingData = sortedNames.map((info) => ({
					id: info.id,
					name: info.name,
					rankings: dateKeys.map((dateKey) => {
						const dayData = dateGroups.get(dateKey);
						if (!dayData) {
							return null;
						}
						const dayEntries = Array.from(dayData.entries()).sort(
							(a, b) => b[1].count - a[1].count,
						);
						const idx = dayEntries.findIndex(([id]) => id === info.id);
						return idx >= 0 ? idx + 1 : null;
					}),
					avgRating: info.avgRating,
					totalSelections: info.totalSelections,
				}));

				return { data: rankingData, timeLabels };
			},
			{ data: [], timeLabels: [] },
		);
	},
};

// ═══════════════════════════════════════════════════════════════════════════════
// leaderboardAPI
// ═══════════════════════════════════════════════════════════════════════════════

export const leaderboardAPI = {
	/** Get global leaderboard data. */
	getLeaderboard: async (limit: number | null = 50) => {
		return withSupabase(async (client) => {
			const { data, error } = await client.rpc("get_leaderboard_stats", {
				limit_count: limit || 50,
			});

			if (error) {
				console.error("Failed to fetch leaderboard stats:", error);
				return [];
			}

			return (data || []).map((row: any) => ({
				name_id: row.name_id,
				name: row.name,
				description: row.description,
				category: row.category,
				avg_rating: Number(row.avg_rating),
				total_ratings: Number(row.total_ratings),
				wins: Number(row.wins),
				losses: Number(row.losses),
				created_at: row.created_at || null,
			}));
		}, []);
	},
};

// ═══════════════════════════════════════════════════════════════════════════════
// statsAPI
// ═══════════════════════════════════════════════════════════════════════════════

export const statsAPI = {
	/** Get global site statistics. */
	getSiteStats: async () => {
		return withSupabase(async (client) => {
			const { data, error } = await client.rpc("get_site_stats");

			if (error) {
				console.error("Failed to fetch site stats:", error);
				throw error;
			}

			if (!data) {
				return null;
			}

			return data as unknown as SiteStatsRpcResult;
		}, null);
	},

	/** Get all names with user-specific ratings. */
	getUserRatedNames: async (userName: string) => {
		return withSupabase(async (client) => {
			const { data, error } = (await client
				.from("cat_name_options")
				.select("*, cat_name_ratings!left (*)")
				.eq("is_active", true)
				.eq("cat_name_ratings.user_name", userName)) as unknown as {
				data: Array<
					Record<string, unknown> & { cat_name_ratings: RatingRow[] | RatingRow | null }
				> | null;
				error: unknown;
			};

			if (error || !data) {
				return [];
			}

			return data.map((item) => {
				const ratingsList = item.cat_name_ratings;
				const userRating = Array.isArray(ratingsList) ? ratingsList[0] : ratingsList;
				return {
					...item,
					user_rating: userRating?.rating ?? null,
					user_wins: userRating?.wins ?? 0,
					user_losses: userRating?.losses ?? 0,
					has_user_rating: !!userRating,
					isHidden: (item as Record<string, unknown>).is_hidden === true,
				};
			});
		}, []);
	},

	/** Get comprehensive user statistics. */
	getUserStats: async (userName: string) => {
		return withSupabase(async (client) => {
			const [ratingsResult, selectionsResult] = await Promise.all([
				client
					.from("cat_name_ratings")
					.select("*")
					.eq("user_name", userName) as unknown as Promise<{
					data: Array<{ rating: number; wins: number; losses: number }> | null;
					error: unknown;
				}>,
				client
					.from("cat_tournament_selections")
					.select("*")
					.eq("user_name", userName) as unknown as Promise<{
					data: unknown[] | null;
					error: unknown;
				}>,
			]);

			const ratings = ratingsResult.data ?? [];
			const selections = selectionsResult.data ?? [];
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
