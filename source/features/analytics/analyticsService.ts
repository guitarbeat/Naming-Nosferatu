import { withSupabase } from "../../shared/services/supabase/client";

export interface SelectionStats {
	name_id: string | number;
	name: string;
	count: number;
}

export interface AnalyticsSelectionStats {
	count: number;
	users: Set<string>;
}

export interface RatingStats {
	totalRating: number;
	count: number;
	wins: number;
	losses: number;
	users: Set<string>;
}

export interface RatingInfo {
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

interface NameRow {
	id: string | number;
	name: string;
	description: string;
	avg_rating: number;
	categories: string[];
	created_at: string;
}

export const analyticsAPI = {
	/**
	 * Get selection popularity
	 */
	getSelectionPopularity: async (limit: number | null = 20) => {
		return withSupabase(async (client) => {
			const { data, error } = await client.from("tournament_selections").select("name_id, name");
			if (error) {
				return [];
			}

			const selectionCounts = new Map<string | number, SelectionStats>();
			(data || []).forEach((row) => {
				const r = row as SelectionRow;
				if (!selectionCounts.has(r.name_id)) {
					selectionCounts.set(r.name_id, {
						name_id: r.name_id,
						name: r.name,
						count: 0,
					});
				}
				const sc = selectionCounts.get(r.name_id);
				if (sc) {
					sc.count += 1;
				}
			});

			let results = Array.from(selectionCounts.values()).sort((a, b) => b.count - a.count);
			if (limit) {
				results = results.slice(0, limit);
			}

			return results.map((item) => ({
				name_id: String(item.name_id),
				name: item.name,
				times_selected: item.count,
			}));
		}, []);
	},

	/**
	 * Get comprehensive popularity analytics
	 */
	getPopularityAnalytics: async (
		limit: number | null = 20,
		userFilter: string | null = "all",
		currentUserName: string | null = null,
	) => {
		return withSupabase(async (client) => {
			let selectionsQuery = client.from("tournament_selections").select("name_id, name, user_name");
			let ratingsQuery = client
				.from("cat_name_ratings")
				.select("name_id, rating, wins, losses, user_name");

			if (userFilter && userFilter !== "all") {
				const targetUser = userFilter === "current" ? currentUserName : userFilter;
				if (targetUser) {
					selectionsQuery = selectionsQuery.eq("user_name", targetUser);
					ratingsQuery = ratingsQuery.eq("user_name", targetUser);
				}
			}

			const [selectionsResult, ratingsResult, namesResult] = await Promise.all([
				selectionsQuery,
				ratingsQuery,
				client
					.from("cat_name_options")
					.select("id, name, description, avg_rating, categories, created_at")
					.eq("is_active", true)
					.eq("is_hidden", false),
			]);

			const selections = selectionsResult.data || [];
			const ratings = ratingsResult.data || [];
			const names = namesResult.data || [];

			const selectionStats = new Map<string | number, AnalyticsSelectionStats>();
			selections.forEach((item) => {
				const s = item as SelectionRow;
				if (!selectionStats.has(s.name_id)) {
					selectionStats.set(s.name_id, { count: 0, users: new Set() });
				}
				const stat = selectionStats.get(s.name_id);
				if (stat) {
					stat.count += 1;
					stat.users.add(s.user_name);
				}
			});

			const ratingStats = new Map<string | number, RatingStats>();
			ratings.forEach((item) => {
				const r = item as RatingRow;
				if (!ratingStats.has(r.name_id)) {
					ratingStats.set(r.name_id, {
						totalRating: 0,
						count: 0,
						wins: 0,
						losses: 0,
						users: new Set(),
					});
				}
				const stat = ratingStats.get(r.name_id);
				if (stat) {
					stat.totalRating += Number(r.rating) || 1500;
					stat.count += 1;
					stat.wins += r.wins || 0;
					stat.losses += r.losses || 0;
					stat.users.add(r.user_name);
				}
			});

			const analytics = names.map((item) => {
				const name = item as NameRow;
				const selStat = selectionStats.get(name.id) || {
					count: 0,
					users: new Set(),
				};
				const ratStat = ratingStats.get(name.id) || {
					totalRating: 0,
					count: 0,
					wins: 0,
					losses: 0,
					users: new Set(),
				};

				const avgRating =
					ratStat.count > 0 ? Math.round(ratStat.totalRating / ratStat.count) : 1500;
				const popularityScore = Math.round(
					selStat.count * 2 + ratStat.wins * 1.5 + (avgRating - 1500) * 0.5,
				);

				return {
					name_id: name.id,
					name: name.name,
					description: name.description,
					category: name.categories?.[0] || null,
					times_selected: selStat.count,
					avg_rating: avgRating,
					popularity_score: popularityScore,
					created_at: name.created_at || null,
				};
			});

			const sorted = analytics.sort((a, b) => b.popularity_score - a.popularity_score);
			return limit ? sorted.slice(0, limit) : sorted;
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
					.from("tournament_selections")
					.select("name_id, name, selected_at")
					.gte("selected_at", startDate.toISOString())
					.order("selected_at", { ascending: true });

				if (selError) {
					console.error("Error fetching selection history:", selError);
					return { data: [], timeLabels: [] };
				}

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

				(selections || []).forEach((item) => {
					const s = item as SelectionRow;
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
	 * Get leaderboard data
	 */
	getLeaderboard: async (limit: number | null = 50, categoryId: string | null = null) => {
		return withSupabase(async (client) => {
			if (categoryId) {
				const { data: topNames, error } = await client.rpc("get_top_names_by_category", {
					p_category: categoryId,
					p_limit: limit ?? undefined,
				});
				if (error) {
					return [];
				}
				return (topNames || []).map((t) => ({
					...t,
					name_id: (t as { id: string | number }).id,
				}));
			}

			const { data: ratings } = await client
				.from("cat_name_ratings")
				.select("name_id, rating, wins, losses");

			const nameStatsMap = new Map<
				string | number,
				{
					totalRating: number;
					count: number;
					totalWins: number;
					totalLosses: number;
				}
			>();
			(ratings || []).forEach((r) => {
				if (!nameStatsMap.has(r.name_id)) {
					nameStatsMap.set(r.name_id, {
						totalRating: 0,
						count: 0,
						totalWins: 0,
						totalLosses: 0,
					});
				}
				const stats = nameStatsMap.get(r.name_id);
				if (stats) {
					stats.totalRating += Number(r.rating) || 1500;
					stats.count += 1;
					stats.totalWins += r.wins || 0;
					stats.totalLosses += r.losses || 0;
				}
			});

			const { data: names } = await client
				.from("cat_name_options")
				.select("id, name, description, avg_rating, categories, created_at")
				.eq("is_active", true)
				.eq("is_hidden", false)
				.order("avg_rating", { ascending: false })
				.limit(limit ? limit * 2 : 100);

			const leaderboard = (names || [])
				.map((row) => {
					const stats = nameStatsMap.get(row.id);
					const avgRating = stats
						? Math.round(stats.totalRating / stats.count)
						: row.avg_rating || 1500;
					return {
						name_id: row.id,
						name: row.name,
						description: row.description,
						category: row.categories?.[0] || null,
						avg_rating: avgRating,
						total_ratings: stats?.count || 0,
						wins: stats?.totalWins || 0,
						losses: stats?.totalLosses || 0,
						created_at: row.created_at || null,
					};
				})
				.filter((row) => row.total_ratings > 0 || row.avg_rating > 1500)
				.sort((a, b) => b.avg_rating - a.avg_rating);

			return limit ? leaderboard.slice(0, limit) : leaderboard;
		}, []);
	},
};

export const statsAPI = {
	/**
	 * Get global site statistics
	 */
	getSiteStats: async () => {
		return withSupabase(async (client) => {
			const [namesResult, hiddenResult, usersResult, ratingsResult, selectionsResult] =
				await Promise.all([
					client
						.from("cat_name_options")
						.select("id", { count: "exact", head: true })
						.eq("is_active", true),
					client
						.from("cat_name_options")
						.select("id", { count: "exact", head: true })
						.eq("is_hidden", true),
					client.from("cat_app_users").select("user_name", { count: "exact", head: true }),
					client.from("cat_name_ratings").select("rating"),
					client.from("tournament_selections").select("id", { count: "exact", head: true }),
				]);

			const totalNames = namesResult.count || 0;
			const ratings = ratingsResult.data || [];
			const avgRating =
				ratings.length > 0
					? Math.round(ratings.reduce((s, r) => s + Number(r.rating), 0) / ratings.length)
					: 1500;

			return {
				totalNames,
				hiddenNames: hiddenResult.count || 0,
				activeNames: totalNames - (hiddenResult.count || 0),
				totalUsers: usersResult.count || 0,
				totalRatings: ratings.length,
				totalSelections: selectionsResult.count || 0,
				avgRating,
			};
		}, null);
	},

	/**
	 * Get all names with user-specific ratings
	 */
	getNamesWithUserRatings: async (userName: string) => {
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
				client.from("tournament_selections").select("*").eq("user_name", userName),
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
