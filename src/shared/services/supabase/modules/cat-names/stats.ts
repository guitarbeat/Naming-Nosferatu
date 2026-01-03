import {
	isDev,
	isSupabaseAvailable,
	resolveSupabaseClient,
} from "../../client";

export const statsAPI = {
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

			// Map selected IDs to a Set for O(1) lookups
			const selectedSet = new Set((selectedIds || []).map((s) => s.name_id));

			// Filter names that have never been selected
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
					*,
					cat_name_ratings!left (*)
				`)
				.eq("is_active", true)
				.eq("cat_name_ratings.user_name", userName);

			if (error) {
				console.error("Error fetching names with user ratings:", error);
				return [];
			}

			// Define interface for the join result shape
			interface JoinResult {
				cat_name_ratings?:
					| { rating: number; wins: number; losses: number }
					| { rating: number; wins: number; losses: number }[];
				is_hidden?: boolean;
				[key: string]: unknown;
			}

			return (data || []).map((item) => {
				const itemWithRatings = item as unknown as JoinResult;
				const ratings = itemWithRatings.cat_name_ratings;
				const userRating = Array.isArray(ratings) ? ratings[0] : ratings;

				return {
					...item,
					user_rating: userRating?.rating || null,
					user_wins: userRating?.wins || 0,
					user_losses: userRating?.losses || 0,
					has_user_rating: !!userRating,
					isHidden: itemWithRatings.is_hidden || false,
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

			const [ratingsResult, selectionsResult] = await Promise.all([
				client.from("cat_name_ratings").select("*").eq("user_name", userName),
				client
					.from("tournament_selections")
					.select("*")
					.eq("user_name", userName),
			]);

			const ratings = ratingsResult.data || [];
			const selections = selectionsResult.data || [];

			const totalWins = ratings.reduce((sum, r) => sum + (r.wins || 0), 0);
			const totalLosses = ratings.reduce((sum, r) => sum + (r.losses || 0), 0);
			const winRate =
				totalWins + totalLosses > 0
					? Math.round((totalWins / (totalWins + totalLosses)) * 100)
					: 0;

			return {
				userName,
				totalRatings: ratings.length,
				totalSelections: selections.length,
				totalWins,
				totalLosses,
				winRate,
				avgUserRating:
					ratings.length > 0
						? Math.round(
								ratings.reduce((sum, r) => sum + (r.rating || 1500), 0) /
									ratings.length,
							)
						: 1500,
			};
		} catch (error) {
			if (isDev) {
				console.error("Error fetching user stats:", error);
			}
			return null;
		}
	},
};
