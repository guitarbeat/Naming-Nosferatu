import { isNameHidden } from "@/shared/lib/basic";
import { withSupabase } from "@/shared/services/supabase/runtime";
import type { IdType, NameItem } from "@/shared/types";

export interface LeaderboardItem {
	name_id: string | number;
	name: string;
	avg_rating: number;
	wins: number;
	total_ratings: number;
	created_at?: string | null;
	date_submitted?: string | null;
	[key: string]: unknown;
}

export interface SiteStats {
	totalNames: number;
	activeNames: number;
	hiddenNames: number;
	totalUsers: number;
	totalRatings: number;
	totalSelections: number;
	avgRating: number;
	[key: string]: unknown;
}

export interface UserStats {
	totalRatings: number;
	totalSelections: number;
	totalWins: number;
	totalLosses?: number;
	winRate: number;
	[key: string]: unknown;
}

export interface EngagementMetrics {
	totalTournaments: number;
	completedTournaments: number;
	averageTournamentTime: number;
	totalMatches: number;
	peakActiveUsers: number;
	dailyActiveUsers: number;
	weeklyActiveUsers: number;
	monthlyActiveUsers: number;
	mostActiveHour: string;
	mostActiveDay: string;
	userRetentionRate: number;
	averageSessionDuration: number;
	totalPageViews: number;
	bounceRate: number;
	[key: string]: unknown;
}

export interface DetailedUserStats extends UserStats {
	lastActiveAt?: string;
	totalTournaments?: number;
	completedTournaments?: number;
	averageTournamentTime?: number;
	favoriteNames?: string[];
	preferredCategories?: string[];
	engagementScore?: number;
	[key: string]: unknown;
}

interface UserRatingRow {
	nameId: IdType;
	rating: number;
	wins?: number;
	losses?: number;
}

export type UserRatedName = NameItem & {
	user_rating: number | null;
	user_wins: number;
	user_losses: number;
	has_user_rating: boolean;
	isHidden: boolean;
};

function toNumber(value: unknown, fallback = 0): number {
	const numeric = Number(value);
	return Number.isFinite(numeric) ? numeric : fallback;
}

function mapLeaderboardRow(row: Record<string, unknown>): LeaderboardItem {
	return {
		name_id: String(row.name_id ?? row.id ?? ""),
		name: String(row.name ?? ""),
		avg_rating: toNumber(row.avg_rating),
		wins: toNumber(row.wins),
		total_ratings: toNumber(row.total_ratings),
		created_at: (row.created_at as string | null | undefined) ?? null,
		date_submitted: (row.date_submitted as string | null | undefined) ?? null,
	};
}

export const leaderboardAPI = {
	getLeaderboard: async (limit: number | null = 50): Promise<LeaderboardItem[]> => {
		return withSupabase(async (client) => {
			const { data, error } = await client.rpc("get_leaderboard_stats", {
				limit_count: limit ?? 50,
			});
			if (error) {
				console.warn("[analyticsService] get_leaderboard_stats failed:", error.message);
				return [];
			}
			return ((data as Array<Record<string, unknown>>) ?? []).map(mapLeaderboardRow);
		}, []);
	},
};

export const statsAPI = {
	getSiteStats: async (): Promise<SiteStats | null> => {
		return withSupabase(async (client) => {
			const { data, error } = await client.rpc("get_site_stats");
			if (error || !data) {
				console.warn("[analyticsService] get_site_stats failed:", error?.message);
				return null;
			}
			const stats = data as Partial<SiteStats>;
			return {
				totalNames: toNumber(stats.totalNames),
				activeNames: toNumber(stats.activeNames),
				hiddenNames: toNumber(stats.hiddenNames),
				totalUsers: toNumber(stats.totalUsers),
				totalRatings: toNumber(stats.totalRatings),
				totalSelections: toNumber(stats.totalSelections),
				avgRating: toNumber(stats.avgRating),
			};
		}, null);
	},

	getEngagementMetrics: async (
		_timeframe: "day" | "week" | "month" | "year",
	): Promise<EngagementMetrics | null> => {
		return withSupabase(async (client) => {
			const [namesResult, usersResult] = await Promise.all([
				client
					.from("cat_names")
					.select("global_wins, global_losses")
					.eq("is_deleted", false),
				client
					.from("user_cat_name_ratings")
					.select("user_name", { count: "exact", head: true }),
			]);

			const totalMatches = (
				(namesResult.data ?? []) as Array<{ global_wins: number | null; global_losses: number | null }>
			).reduce((sum, row) => sum + toNumber(row.global_wins), 0);

			const peakActiveUsers = usersResult.count ?? 0;

			return {
				totalTournaments: 0,
				completedTournaments: 0,
				averageTournamentTime: 0,
				totalMatches,
				peakActiveUsers,
				dailyActiveUsers: 0,
				weeklyActiveUsers: 0,
				monthlyActiveUsers: 0,
				mostActiveHour: "N/A",
				mostActiveDay: "N/A",
				userRetentionRate: 0,
				averageSessionDuration: 0,
				totalPageViews: 0,
				bounceRate: 0,
			};
		}, null);
	},

	getDetailedUserStats: async (userName: string): Promise<DetailedUserStats | null> => {
		return withSupabase(async (client) => {
			const { data, error } = await client.rpc("get_user_stats", {
				p_user_name: userName,
			});
			if (error || !data) {
				console.warn("[analyticsService] get_user_stats failed:", error?.message);
				return null;
			}
			const stats = data as Partial<DetailedUserStats>;
			return {
				totalRatings: toNumber(stats.totalRatings),
				totalSelections: toNumber(stats.totalSelections),
				totalWins: toNumber(stats.totalWins),
				totalLosses: toNumber(stats.totalLosses),
				winRate: toNumber(stats.winRate),
			};
		}, null);
	},

	getUserRatedNames: async (userName: string): Promise<UserRatedName[]> => {
		return withSupabase(async (client) => {
			const [namesResult, ratingsResult] = await Promise.all([
				client
					.from("cat_names")
					.select(
						"id, name, description, avg_rating, global_wins, global_losses, created_at, is_hidden, is_active, locked_in, status",
					)
					.eq("is_active", true)
					.eq("is_deleted", false)
					.order("avg_rating", { ascending: false }),
				client.rpc("get_user_ratings", { p_user_name: userName }),
			]);

			if (namesResult.error) {
				console.warn("[analyticsService] Names query failed:", namesResult.error.message);
				return [];
			}

			const names: NameItem[] = (
				(namesResult.data ?? []) as Array<Record<string, unknown>>
			).map((row) => ({
				id: String(row.id ?? ""),
				name: String(row.name ?? ""),
				description: typeof row.description === "string" ? row.description : "",
				avgRating: typeof row.avg_rating === "number" ? row.avg_rating : 1500,
				avg_rating: typeof row.avg_rating === "number" ? row.avg_rating : 1500,
				wins: typeof row.global_wins === "number" ? row.global_wins : 0,
				losses: typeof row.global_losses === "number" ? row.global_losses : 0,
				createdAt: typeof row.created_at === "string" ? row.created_at : null,
				created_at: typeof row.created_at === "string" ? row.created_at : null,
				isHidden: Boolean(row.is_hidden ?? false),
				is_hidden: Boolean(row.is_hidden ?? false),
				isActive: row.is_active == null ? true : Boolean(row.is_active),
				is_active: row.is_active == null ? true : Boolean(row.is_active),
				lockedIn: Boolean(row.locked_in ?? false),
				locked_in: Boolean(row.locked_in ?? false),
				status: (typeof row.status === "string" ? row.status : "candidate") as NameItem["status"],
				provenance: [],
				has_user_rating: false,
			}));

			const ratingMap = new Map<string, UserRatingRow>();
			if (!ratingsResult.error && ratingsResult.data) {
				for (const r of ratingsResult.data as Array<{
					name_id: string;
					rating: number;
					wins: number;
					losses: number;
				}>) {
					ratingMap.set(String(r.name_id), {
						nameId: r.name_id,
						rating: r.rating,
						wins: r.wins,
						losses: r.losses,
					});
				}
			}

			return names.map((item) => {
				const userRating = ratingMap.get(String(item.id));
				return {
					...item,
					user_rating: userRating ? toNumber(userRating.rating) : null,
					user_wins: toNumber(userRating?.wins),
					user_losses: toNumber(userRating?.losses),
					has_user_rating: Boolean(userRating),
					isHidden: isNameHidden(item),
				};
			});
		}, []);
	},

	getUserStats: async (userName: string): Promise<UserStats | null> => {
		return withSupabase(async (client) => {
			const { data, error } = await client.rpc("get_user_stats", {
				p_user_name: userName,
			});
			if (error || !data) {
				console.warn("[analyticsService] get_user_stats failed:", error?.message);
				return null;
			}
			const stats = data as Partial<UserStats>;
			return {
				totalRatings: toNumber(stats.totalRatings),
				totalSelections: toNumber(stats.totalSelections),
				totalWins: toNumber(stats.totalWins),
				totalLosses: toNumber(stats.totalLosses),
				winRate: toNumber(stats.winRate),
			};
		}, null);
	},
};
