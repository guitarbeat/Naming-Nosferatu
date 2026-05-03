import { subDays, subMonths, subWeeks, subYears } from "date-fns";
import { computeRatingStats, getPercentileRank } from "@/shared/lib/ratingStats";
import { withSupabase } from "./runtime";
import { throwOnRpcError } from "./errorUtils";
import type { IdType, NameItem } from "@/shared/types";
import { mapNameRow, type RawNameRow } from "@/shared/lib/names/mapNameRow";

export interface LeaderboardItem {
        name_id: string | number;
        name: string;
        avg_rating: number;
        wins: number;
        losses: number;
        total_ratings: number;
        percentile_rank?: number;
        confidence?: number;
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
                losses: toNumber(row.losses),
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
                        throwOnRpcError(error, "Failed to fetch leaderboard stats");
                        const rows = ((data as Array<Record<string, unknown>>) ?? []).map(mapLeaderboardRow);

                        const allRatings = rows.map((r) => r.avg_rating);
                        const stats = computeRatingStats(allRatings);

                        return rows.map((row) => ({
                                ...row,
                                percentile_rank: getPercentileRank(row.avg_rating, allRatings),
                                confidence: stats ? Math.min(1, row.total_ratings / 15) : 0,
                        }));
                }, []);
        },
};

export const statsAPI = {
        getSiteStats: async (): Promise<SiteStats | null> => {
                return withSupabase(async (client) => {
                        const { data, error } = await client.rpc("get_site_stats");
                        throwOnRpcError(error, "Failed to fetch site stats");
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
                timeframe: "day" | "week" | "month" | "year",
        ): Promise<EngagementMetrics | null> => {
                return withSupabase(async (client) => {
                        const now = new Date();
                        const startDate = {
                                day: subDays(now, 1),
                                week: subWeeks(now, 1),
                                month: subMonths(now, 1),
                                year: subYears(now, 1),
                        }[timeframe];

                        const [namesResult, usersResult] = await Promise.all([
                                client
                                        .from("cat_names")
                                        .select("global_wins, global_losses")
                                        .eq("is_deleted", false)
                                        .gte("created_at", startDate.toISOString()),
                                client
                                        .from("user_cat_name_ratings")
                                        .select("user_name, updated_at", { count: "exact", head: true })
                                        .gte("updated_at", startDate.toISOString()),
                        ]);

                        const totalMatches = (
                                (namesResult.data ?? []) as Array<{
                                        global_wins: number | null;
                                        global_losses: number | null;
                                }>
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

        getUserStats: async (userName: string): Promise<UserStats | null> => {
                return withSupabase(async (client) => {
                        const { data, error } = await client.rpc("get_user_stats", {
                                p_user_name: userName,
                        });
                        throwOnRpcError(error, "Failed to fetch user stats");
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
