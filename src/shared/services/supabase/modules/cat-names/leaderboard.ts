import {
	isDev,
	isSupabaseAvailable,
	resolveSupabaseClient,
} from "../../client";
import type { NameStats } from "./types";

export const leaderboardAPI = {
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

				interface TopNameItem {
					id: string | number;
					[key: string]: unknown;
				}

				return (topNames || []).map((item) => {
					const t = item as unknown as TopNameItem;
					return {
						...t,
						name_id: t.id,
					};
				});
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
};
