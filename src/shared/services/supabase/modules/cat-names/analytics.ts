import {
	isDev,
	isSupabaseAvailable,
	resolveSupabaseClient,
} from "../../client";
import type {
	AnalyticsSelectionStats,
	RatingInfo,
	RatingStats,
	SelectionStats,
} from "./types";

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
				const r = row as unknown as SelectionRow;
				if (!selectionCounts.has(r.name_id)) {
					selectionCounts.set(r.name_id, {
						name_id: r.name_id,
						name: r.name,
						count: 0,
					});
				}
				const sc = selectionCounts.get(r.name_id);
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
			selections.forEach((item) => {
				const s = item as unknown as SelectionRow;
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
			ratings.forEach((item) => {
				const r = item as unknown as RatingRow;
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

			const analytics = names.map((item) => {
				const name = item as unknown as NameRow;
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

			(selections || []).forEach((item) => {
				const s = item as unknown as SelectionRow;
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
};
