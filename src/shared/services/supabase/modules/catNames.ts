import { isDev, isSupabaseAvailable, resolveSupabaseClient } from "../client";

interface NameItem {
	id: string;
	name: string;
	description?: string;
	avg_rating?: number;
	is_active: boolean;
	is_hidden?: boolean;
	created_at?: string;
}

interface NameStats {
	totalRating: number;
	count: number;
	totalWins: number;
	totalLosses: number;
}

interface SelectionStats {
	name_id: string | number;
	name: string;
	count: number;
}

interface AnalyticsSelectionStats {
	count: number;
	users: Set<string>;
}

interface RatingStats {
	totalRating: number;
	count: number;
	wins: number;
	losses: number;
	users: Set<string>;
}

interface RatingInfo {
	rating: number;
	wins: number;
}

interface NameDataWithRatings {
	id: string;
	name: string;
	description?: string;
	avg_rating?: number;
	is_active: boolean;
	is_hidden?: boolean;
	created_at?: string;
	cat_name_ratings?: Array<{
		user_name: string;
		rating?: number;
		wins?: number;
		losses?: number;
		updated_at?: string;
	}>;
}

export const catNamesAPI = {
	/**
	 * Get all names with descriptions and ratings
	 * @param {boolean} includeHidden - If true, include hidden names (for admin views)
	 */
	async getNamesWithDescriptions(includeHidden: boolean = false) {
		try {
			const client = await resolveSupabaseClient();

			if (!client) {
				if (isDev) {
					console.warn("Supabase not available, using fallback names");
				}
				const fallbackNames = [
					"aaron",
					"fix",
					"the",
					"whiskers",
					"shadow",
					"luna",
					"felix",
					"milo",
				].map((name) => ({
					id: name,
					name: name,
					description: "temporary fallback — Supabase not configured",
					avg_rating: 1500,
					popularity_score: 0,
					total_tournaments: 0,
					is_active: true,
					created_at: new Date().toISOString(),
					updated_at: null,
					user_rating: null,
					user_wins: 0,
					user_losses: 0,
					isHidden: false,
					has_user_rating: false,
				}));
				return fallbackNames;
			}

			let query = client
				.from("cat_name_options")
				.select(`
					id,
					name,
					description,
					created_at,
					avg_rating,
					is_active,
					is_hidden
				`)
				.eq("is_active", true)
				.order("avg_rating", { ascending: false });

			if (!includeHidden) {
				query = query.eq("is_hidden", false);
			}

			const { data, error } = await query;

			if (error) {
				console.error("Error fetching names with descriptions:", error);
				return [];
			}

			if (!data || data.length === 0) {
				console.warn("No active names found in database, using fallback names");
				// reuse fallback logic
				return [
					"aaron",
					"fix",
					"the",
					"whiskers",
					"shadow",
					"luna",
					"felix",
					"milo",
				].map((name) => ({
					id: name,
					name: name,
					description: "temporary fallback — no active names in database",
					avg_rating: 1500,
					popularity_score: 0,
					total_tournaments: 0,
					is_active: true,
					created_at: new Date().toISOString(),
					updated_at: null,
					user_rating: null,
					user_wins: 0,
					user_losses: 0,
					isHidden: false,
					has_user_rating: false,
				}));
			}

			return (data as unknown as NameItem[]).map((item) => ({
				...item,
				updated_at: null,
				user_rating: null,
				user_wins: 0,
				user_losses: 0,
				isHidden: item.is_hidden || false,
				has_user_rating: false,
			}));
		} catch (error) {
			if (isDev) {
				console.error("Error fetching names:", error);
			}
			throw error;
		}
	},

	/**
	 * Add a new name option
	 */
	async addName(
		name: string,
		description: string = "",
		userName: string | null = null,
	) {
		try {
			if (!(await isSupabaseAvailable())) {
				return { success: false, error: "Supabase not configured" };
			}

			const client = await resolveSupabaseClient();
			if (!client) return { success: false, error: "Supabase not configured" };

			if (userName?.trim()) {
				try {
					await client.rpc("set_user_context", {
						user_name_param: userName.trim(),
					});
				} catch (rpcError) {
					if (isDev) {
						console.warn("Failed to set user context for RLS:", rpcError);
					}
				}
			}

			const { data, error } = await client
				.from("cat_name_options")
				.insert([{ name: name.trim(), description: description.trim() }])
				.select()
				.single();

			if (error) {
				console.error("Error adding name:", error);
				return { success: false, error: error.message || "Failed to add name" };
			}
			return { success: true, data };
		} catch (error) {
			if (isDev) {
				console.error("Error adding name:", error);
			}
			return {
				success: false,
				error:
					(error as { message?: string }).message || "Unknown error occurred",
			};
		}
	},

	/**
	 * Remove a name option
	 */
	async removeName(name: string) {
		try {
			if (!(await isSupabaseAvailable())) {
				return { success: false, error: "Supabase not configured" };
			}

			const client = await resolveSupabaseClient();
			if (!client) return { success: false, error: "Supabase not configured" };

			const { error } = await client
				.from("cat_name_options")
				.delete()
				.eq("name", name);

			if (error) {
				console.error("Error removing name:", error);
				return {
					success: false,
					error: error.message || "Failed to remove name",
				};
			}
			return { success: true };
		} catch (error) {
			if (isDev) {
				console.error("Error removing name:", error);
			}
			return {
				success: false,
				error:
					(error as { message?: string }).message || "Unknown error occurred",
			};
		}
	},

	/**
	 * Get leaderboard data
	 */
	async getLeaderboard(
		limit: number | null = 50,
		categoryId: string | null = null,
		_minTournaments: number = 3,
	) {
		try {
			if (!(await isSupabaseAvailable())) return [];

			const client = await resolveSupabaseClient();
			if (!client) return [];

			if (categoryId) {
				const { data: topNames, error: categoryError } = await client.rpc(
					"get_top_names_by_category",
					{
						p_category: categoryId,
						p_limit: limit ?? undefined,
					},
				);

				if (categoryError) {
					console.error("Error fetching category leaderboard:", categoryError);
					return [];
				}
				return topNames || [];
			}

			const { data: ratingStats, error: ratingError } = await client
				.from("cat_name_ratings")
				.select("name_id, rating, wins, losses");

			if (ratingError) {
				console.error("Error fetching rating stats:", ratingError);
			}

			const nameStats = new Map<string | number, NameStats>();
			(ratingStats || []).forEach((r) => {
				if (!nameStats.has(r.name_id)) {
					nameStats.set(r.name_id, {
						totalRating: 0,
						count: 0,
						totalWins: 0,
						totalLosses: 0,
					});
				}
				const stats = nameStats.get(r.name_id);
				if (stats) {
					stats.totalRating += Number(r.rating) || 1500;
					stats.count += 1;
					stats.totalWins += r.wins || 0;
					stats.totalLosses += r.losses || 0;
				}
			});

			let query = client
				.from("cat_name_options")
				.select("id, name, description, avg_rating, categories, created_at")
				.eq("is_active", true)
				.eq("is_hidden", false)
				.order("avg_rating", { ascending: false });

			if (limit) {
				query = query.limit(limit * 2);
			}

			const { data, error } = await query;
			if (error) {
				console.error("Error fetching leaderboard:", error);
				return [];
			}

			const leaderboard = (data || [])
				.map((row) => {
					const stats = nameStats.get(row.id);
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
		} catch (error) {
			if (isDev) {
				console.error("Error fetching leaderboard:", error);
			}
			return [];
		}
	},

	/**
	 * Get selection popularity
	 */
	async getSelectionPopularity(limit: number | null = 20) {
		try {
			if (!(await isSupabaseAvailable())) return [];

			const client = await resolveSupabaseClient();
			if (!client) return [];

			const { data, error } = await client
				.from("tournament_selections")
				.select("name_id, name");

			if (error) {
				console.error("Error fetching selection popularity:", error);
				return [];
			}

			const selectionCounts = new Map<string | number, SelectionStats>();
			(data || []).forEach((row) => {
				if (!selectionCounts.has(row.name_id)) {
					selectionCounts.set(row.name_id, {
						name_id: row.name_id,
						name: row.name,
						count: 0,
					});
				}
				const sc = selectionCounts.get(row.name_id);
				if (sc) sc.count += 1;
			});

			let results = Array.from(selectionCounts.values()).sort(
				(a, b) => b.count - a.count,
			);
			if (limit) results = results.slice(0, limit);

			return results.map((item) => ({
				name_id: String(item.name_id),
				name: item.name,
				times_selected: item.count,
			}));
		} catch (error) {
			if (isDev) {
				console.error("Error fetching selection popularity:", error);
			}
			return [];
		}
	},

	/**
	 * Get comprehensive popularity analytics
	 */
	async getPopularityAnalytics(
		limit: number | null = 20,
		userFilter: string | null = "all",
		currentUserName: string | null = null,
	) {
		try {
			if (!(await isSupabaseAvailable())) return [];

			const client = await resolveSupabaseClient();
			if (!client) return [];

			let selectionsQuery = client
				.from("tournament_selections")
				.select("name_id, name, user_name");
			let ratingsQuery = client
				.from("cat_name_ratings")
				.select("name_id, rating, wins, losses, user_name");

			if (userFilter && userFilter !== "all") {
				const targetUser =
					userFilter === "current" ? currentUserName : userFilter;
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

			const selectionStats = new Map<
				string | number,
				AnalyticsSelectionStats
			>();
			selections.forEach((s) => {
				if (!selectionStats.has(s.name_id)) {
					selectionStats.set(s.name_id, { count: 0, users: new Set<string>() });
				}
				const stat = selectionStats.get(s.name_id);
				if (stat) {
					stat.count += 1;
					stat.users.add(s.user_name);
				}
			});

			const ratingStats = new Map<string | number, RatingStats>();
			ratings.forEach((r) => {
				if (!ratingStats.has(r.name_id)) {
					ratingStats.set(r.name_id, {
						totalRating: 0,
						count: 0,
						wins: 0,
						losses: 0,
						users: new Set<string>(),
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

			const analytics = names.map((name) => {
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
					ratStat.count > 0
						? Math.round(ratStat.totalRating / ratStat.count)
						: 1500;
				const winRate =
					ratStat.wins + ratStat.losses > 0
						? Math.round((ratStat.wins / (ratStat.wins + ratStat.losses)) * 100)
						: 0;
				const popularityScore = Math.round(
					selStat.count * 2 + ratStat.wins * 1.5 + (avgRating - 1500) * 0.5,
				);

				return {
					name_id: name.id,
					name: name.name,
					description: name.description,
					category: name.categories?.[0] || null,
					times_selected: selStat.count,
					unique_selectors: selStat.users.size,
					avg_rating: avgRating,
					total_wins: ratStat.wins,
					total_losses: ratStat.losses,
					win_rate: winRate,
					users_rated: ratStat.users.size,
					popularity_score: popularityScore,
					created_at: name.created_at || null,
				};
			});

			const sorted = analytics.sort(
				(a, b) => b.popularity_score - a.popularity_score,
			);
			return limit ? sorted.slice(0, limit) : sorted;
		} catch (error) {
			if (isDev) {
				console.error("Error fetching popularity analytics:", error);
			}
			return [];
		}
	},

	/**
	 * Get global site statistics
	 */
	async getSiteStats() {
		try {
			const client = await resolveSupabaseClient();
			if (!client) return null;

			const [
				namesResult,
				hiddenResult,
				usersResult,
				ratingsResult,
				selectionsResult,
			] = await Promise.all([
				client
					.from("cat_name_options")
					.select("id", { count: "exact", head: true })
					.eq("is_active", true),
				client
					.from("cat_name_options")
					.select("id", { count: "exact", head: true })
					.eq("is_hidden", true),
				client
					.from("cat_app_users")
					.select("user_name", { count: "exact", head: true }),
				client.from("cat_name_ratings").select("rating"),
				client
					.from("tournament_selections")
					.select("id", { count: "exact", head: true }),
			]);

			const totalNames = namesResult.count || 0;
			const hiddenNames = hiddenResult.count || 0;
			const totalUsers = usersResult.count || 0;
			const totalSelections = selectionsResult.count || 0;

			const ratings = ratingsResult.data || [];
			let avgRating = 1500;
			if (ratings.length > 0) {
				const sum = ratings.reduce((s, r) => s + Number(r.rating), 0);
				avgRating = Math.round(sum / ratings.length);
			}

			const { data: neverSelected } = await client
				.from("cat_name_options")
				.select("id, name")
				.eq("is_active", true)
				.eq("is_hidden", false);

			const { data: selectedIds } = await client
				.from("tournament_selections")
				.select("name_id");
			const selectedSet = new Set((selectedIds || []).map((s) => s.name_id));
			const neverSelectedNames = (neverSelected || []).filter(
				(n) => !selectedSet.has(n.id),
			);

			return {
				totalNames,
				hiddenNames,
				activeNames: totalNames - hiddenNames,
				totalUsers,
				totalRatings: ratings.length,
				totalSelections,
				avgRating,
				neverSelectedCount: neverSelectedNames.length,
				neverSelectedNames: neverSelectedNames.slice(0, 10).map((n) => n.name),
			};
		} catch (error) {
			if (isDev) {
				console.error("Error fetching site stats:", error);
			}
			return null;
		}
	},

	/**
	 * Get ranking history
	 */
	async getRankingHistory(
		topN = 10,
		periods = 7,
		options: { periods?: number; dateFilter?: string } = {},
	): Promise<{
		data: Array<{
			id: string;
			name: string;
			rankings: (number | null)[];
			avgRating: number;
			totalSelections: number;
		}>;
		timeLabels: string[];
	}> {
		try {
			if (!(await isSupabaseAvailable())) return { data: [], timeLabels: [] };

			const client = await resolveSupabaseClient();
			if (!client) return { data: [], timeLabels: [] };

			const dateFilterPeriods = {
				today: 2,
				week: 7,
				month: 30,
				year: 365,
				all: periods,
			};
			const dateFilterKey =
				options?.dateFilter as keyof typeof dateFilterPeriods;
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
			(ratings || []).forEach(
				(r: {
					name_id: string;
					rating: number | null;
					wins: number | null;
				}) => {
					const existing = ratingMap.get(r.name_id);
					if (!existing || (r.rating && r.rating > existing.rating)) {
						ratingMap.set(r.name_id, {
							rating: r.rating || 1500,
							wins: r.wins || 0,
						});
					}
				},
			);

			const dateGroups = new Map<
				string,
				Map<string, { name: string; count: number }>
			>();
			const nameData = new Map<
				string,
				{ id: string; name: string; avgRating: number; totalSelections: number }
			>();

			(selections || []).forEach((s) => {
				const [date] = new Date(s.selected_at).toISOString().split("T");
				if (!dateGroups.has(date)) dateGroups.set(date, new Map());
				const dayMap = dateGroups.get(date);
				if (!dayMap) return;
				if (!dayMap.has(s.name_id))
					dayMap.set(s.name_id, { name: s.name, count: 0 });
				const dayData = dayMap.get(s.name_id);
				if (dayData) dayData.count += 1;

				if (!nameData.has(s.name_id)) {
					const ratingInfo = ratingMap.get(s.name_id) || {
						rating: 1500,
						wins: 0,
					};
					nameData.set(s.name_id, {
						id: s.name_id,
						name: s.name,
						avgRating: ratingInfo.rating,
						totalSelections: 0,
					});
				}
				const ns = nameData.get(s.name_id);
				if (ns) ns.totalSelections += 1;
			});

			const timeLabels: string[] = [];
			const today = new Date();
			for (let i = periodCount - 1; i >= 0; i--) {
				const d = new Date(today);
				d.setDate(d.getDate() - i);
				timeLabels.push(
					d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
				);
			}

			const dateKeys: string[] = [];
			for (let i = periodCount - 1; i >= 0; i--) {
				const d = new Date(today);
				d.setDate(d.getDate() - i);
				dateKeys.push(d.toISOString().split("T")[0]);
			}

			const sortedNames = Array.from(nameData.values())
				.sort((a, b) => b.totalSelections - a.totalSelections)
				.slice(0, topN);

			const rankingData = sortedNames.map((nameInfo) => {
				const rankings = dateKeys.map((dateKey) => {
					const dayData = dateGroups.get(dateKey);
					if (!dayData) return null;
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
		} catch (error) {
			if (isDev) {
				console.error("Error fetching ranking history:", error);
			}
			return { data: [], timeLabels: [] };
		}
	},

	/**
	 * Get all names with user-specific ratings
	 */
	async getNamesWithUserRatings(userName: string) {
		try {
			if (!(await isSupabaseAvailable())) {
				console.warn("Supabase not available, using fallback names");
				return [
					{
						id: "aaron",
						name: "aaron",
						description: "temporary fallback — Supabase not configured",
						avg_rating: 1500,
						popularity_score: 0,
						total_tournaments: 0,
						times_selected: 0,
						is_active: true,
						created_at: new Date().toISOString(),
						updated_at: null,
						user_rating: null,
						user_wins: 0,
						user_losses: 0,
						isHidden: false,
						has_user_rating: false,
					},
				];
			}

			const client = await resolveSupabaseClient();
			if (!client) return [];

			const { data, error } = await client
				.from("cat_name_options")
				.select(`
					id,
					name,
					description,
					created_at,
					avg_rating,
					is_active,
					is_hidden,
					cat_name_ratings!left (
						user_name,
						rating,
						wins,
						losses,
						updated_at
					)
				`)
				.eq("is_active", true)
				.order("name");

			if (error) {
				console.error("Error fetching names with user ratings:", error);
				return [];
			}

			const { data: selectionData } = await client
				.from("tournament_selections")
				.select("name_id");

			const selectionCounts = new Map<string | number, number>();
			(selectionData || []).forEach((row) => {
				const count = selectionCounts.get(row.name_id) || 0;
				selectionCounts.set(row.name_id, count + 1);
			});

			if (!data || !Array.isArray(data)) return [];

			return data.map((item) => {
				const itemWithRatings = item as unknown as NameDataWithRatings;
				const userRating = itemWithRatings.cat_name_ratings?.find(
					(r) => r.user_name === userName,
				);
				const isHidden = itemWithRatings.is_hidden === true;

				if (isDev && isHidden) {
					console.log(
						`🔍 Found globally hidden name: ${itemWithRatings.name} (${itemWithRatings.id})`,
						{ isHidden },
					);
				}

				return {
					...(item as unknown as Record<string, unknown>),
					popularity_score: 0,
					total_tournaments: 0,
					times_selected: selectionCounts.get(String(itemWithRatings.id)) || 0,
					user_rating: userRating?.rating || null,
					user_wins: userRating?.wins || 0,
					user_losses: userRating?.losses || 0,
					isHidden,
					updated_at: userRating?.updated_at || null,
					has_user_rating: !!userRating?.rating,
				};
			});
		} catch (error) {
			if (isDev) {
				console.error("Error fetching names with user ratings:", error);
			}
			return [];
		}
	},

	/**
	 * Get comprehensive user statistics
	 */
	async getUserStats(userName: string) {
		try {
			if (!(await isSupabaseAvailable())) return null;

			const client = await resolveSupabaseClient();
			if (!client) return null;

			const { data, error } = await client.rpc("get_user_stats", {
				p_user_name: userName,
			});

			if (error) {
				console.error("Error fetching user stats:", error);
				return null;
			}

			return data?.[0] || null;
		} catch (error) {
			console.error("Error fetching user stats:", error);
			return null;
		}
	},
};
