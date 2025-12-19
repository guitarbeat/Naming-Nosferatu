/**
 * @module profileService
 * @description Centralized service for profile-related database operations and statistics.
 */

import {
    resolveSupabaseClient,
    getUserStats,
    deleteName,
    hiddenNamesAPI,
    adminAPI,
} from "../../../shared/services/supabase/supabaseClient";
import { devLog, devError } from "../../../shared/utils/coreUtils";

// ============================================================================
// Types
// ============================================================================

export interface UserStats {
    avg_rating?: number;
    hidden_count?: number;
    total_losses?: number;
    total_ratings?: number;
    total_wins?: number;
    win_rate?: number;
    names_rated?: number;
    active_ratings?: number;
    hidden_ratings?: number;
    avg_rating_given?: number;
    total_tournaments?: number;
    total_selections?: number;
    unique_users?: number;
    is_aggregate?: boolean;
}

export interface SelectionStats {
    totalSelections: number;
    totalTournaments: number;
    avgSelectionsPerName: number;
    mostSelectedName: string;
    currentStreak: number;
    maxStreak: number;
    userRank: string;
    uniqueUsers: number;
    isAggregate: boolean;
    insights: {
        selectionPattern: string;
        preferredCategories: string;
        improvementTip: string;
    };
    nameSelectionCounts: Record<string, number>;
    nameLastSelected: Record<string, string>;
    nameSelectionFrequency: Record<string, number>;
}

export interface UserWithRoles {
    user_name: string;
    user_roles?: {
        role: string;
    } | null;
    created_at?: string | null;
    updated_at?: string | null;
}

// ============================================================================
// Core Statistics (from profileStats.ts)
// ============================================================================

/**
 * * Fetch user statistics from database or calculate aggregate stats
 */
export async function fetchUserStats(userName: string | null): Promise<UserStats | null> {
    if (userName === null) {
        try {
            const supabaseClient = await resolveSupabaseClient();
            if (!supabaseClient) return null;

            const { data: ratings, error: ratingsError } = await supabaseClient
                .from("cat_name_ratings")
                .select("rating, wins, losses, user_name");

            if (ratingsError) {
                devError("Error fetching aggregate ratings:", ratingsError);
                return null;
            }

            const { data: selections, error: selectionsError } = await supabaseClient
                .from("tournament_selections")
                .select("user_name, tournament_id");

            if (selectionsError) {
                devError("Error fetching aggregate selections:", selectionsError);
                return null;
            }

            const totalRatings = ratings?.length || 0;
            const totalWins = ratings?.reduce((sum, r) => sum + (r.wins || 0), 0) || 0;
            const totalLosses = ratings?.reduce((sum, r) => sum + (r.losses || 0), 0) || 0;
            const avgRating = totalRatings > 0
                ? Math.round(ratings.reduce((sum, r) => sum + (r.rating || 1500), 0) / totalRatings)
                : 1500;
            const uniqueUsers = new Set([
                ...(ratings?.map((r) => r.user_name) || []),
                ...(selections?.map((s) => s.user_name) || []),
            ]).size;
            const totalTournaments = new Set(selections?.map((s) => s.tournament_id) || []).size;

            return {
                names_rated: totalRatings,
                active_ratings: totalRatings,
                hidden_ratings: 0,
                avg_rating_given: avgRating,
                total_wins: totalWins,
                total_losses: totalLosses,
                total_tournaments: totalTournaments,
                total_selections: selections?.length || 0,
                unique_users: uniqueUsers,
                is_aggregate: true,
            };
        } catch (error) {
            devError("Error calculating aggregate stats:", error);
            return null;
        }
    }

    if (!userName) return null;
    try {
        const dbStats = await getUserStats(userName);
        return dbStats || null;
    } catch (error) {
        devError("Error fetching user stats from DB:", error);
        return null;
    }
}

/**
 * * Calculate selection analytics using tournament_selections table
 */
export async function calculateSelectionStats(userName: string | null): Promise<SelectionStats | null> {
    try {
        const supabaseClient = await resolveSupabaseClient();
        if (!supabaseClient) return null;

        let query = supabaseClient.from("tournament_selections").select("name_id, name, tournament_id, selected_at, user_name");
        if (userName !== null) query = query.eq("user_name", userName);

        const { data: selections, error } = await query.order("selected_at", { ascending: false });
        if (error || !selections || selections.length === 0) return null;

        const totalSelections = selections.length;
        const uniqueTournaments = new Set(selections.map((s) => s.tournament_id)).size;
        const uniqueNames = new Set(selections.map((s) => s.name_id)).size;
        const uniqueUsers = userName === null ? new Set(selections.map((s) => s.user_name)).size : 1;

        const nameCounts: Record<string, number> = {};
        const nameSelectionCounts: Record<string, number> = {};
        const nameLastSelected: Record<string, string> = {};
        const nameSelectionFrequency: Record<string, number> = {};

        selections.forEach((s: any) => {
            if (s.name) nameCounts[s.name] = (nameCounts[s.name] || 0) + 1;
            if (s.name_id) {
                nameSelectionCounts[s.name_id] = (nameSelectionCounts[s.name_id] || 0) + 1;
                const selectedDate = s.selected_at ? new Date(s.selected_at) : null;
                if (selectedDate && (!nameLastSelected[s.name_id] || selectedDate > new Date(nameLastSelected[s.name_id]))) {
                    nameLastSelected[s.name_id] = s.selected_at;
                }
            }
        });

        Object.keys(nameSelectionCounts).forEach((nameId) => {
            nameSelectionFrequency[nameId] = uniqueTournaments > 0 ? Math.round((nameSelectionCounts[nameId] / uniqueTournaments) * 100) / 100 : 0;
        });

        const mostSelectedName = Object.entries(nameCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A";
        const sortedDates = selections.map((s: any) => new Date(s.selected_at || Date.now()).toDateString()).sort().filter((d, i, a) => i === 0 || d !== a[i - 1]);

        let currentStreak = 0; let maxStreak = 0; let tempStreak = 0;
        for (let i = 0; i < sortedDates.length; i++) {
            if (i === 0) tempStreak = 1;
            else {
                const dayDiff = Math.floor((new Date(sortedDates[i]).getTime() - new Date(sortedDates[i - 1]).getTime()) / (1000 * 60 * 60 * 24));
                if (dayDiff === 1) tempStreak++;
                else { maxStreak = Math.max(maxStreak, tempStreak); tempStreak = 1; }
            }
        }
        maxStreak = Math.max(maxStreak, tempStreak);
        currentStreak = tempStreak;

        return {
            totalSelections,
            totalTournaments: uniqueTournaments,
            avgSelectionsPerName: uniqueNames > 0 ? Math.round((totalSelections / uniqueNames) * 10) / 10 : 0,
            mostSelectedName,
            currentStreak: userName === null ? 0 : currentStreak,
            maxStreak: userName === null ? 0 : maxStreak,
            userRank: "N/A",
            uniqueUsers: userName === null ? uniqueUsers : 1,
            isAggregate: userName === null,
            insights: {
                selectionPattern: userName === null ? "Aggregate data from all users" : generateSelectionPattern(totalSelections, uniqueTournaments),
                preferredCategories: await generatePreferredCategories(selections),
                improvementTip: userName === null ? `Total activity across ${uniqueUsers} users` : generateImprovementTip(totalSelections, uniqueTournaments, currentStreak),
            },
            nameSelectionCounts,
            nameLastSelected,
            nameSelectionFrequency,
        };
    } catch (error) {
        devError("Error calculating selection stats:", error);
        return null;
    }
}

// ============================================================================
// Internal Helpers
// ============================================================================

function generateSelectionPattern(total: number, unique: number) {
    const avg = Math.round((total / unique) * 10) / 10;
    if (avg > 8) return "You prefer large tournaments with many names";
    if (avg > 4) return "You enjoy medium-sized tournaments";
    return "You prefer focused, smaller tournaments";
}

async function generatePreferredCategories(selections: any[]) {
    try {
        const nameIds = selections.map((s) => String(s.name_id)).filter(Boolean);
        const supabaseClient = await resolveSupabaseClient();
        if (!supabaseClient || nameIds.length === 0) return "Analyzing your preferences...";

        const { data: names, error } = await supabaseClient.from("cat_name_options").select("categories").in("id", nameIds);
        if (error || !names) return "Analyzing your preferences...";

        const categoryCounts: Record<string, number> = {};
        names.forEach((name) => {
            if (name.categories && Array.isArray(name.categories)) {
                name.categories.forEach((cat: string) => { categoryCounts[cat] = (categoryCounts[cat] || 0) + 1; });
            }
        });

        const top = Object.entries(categoryCounts).sort(([, a], [, b]) => b - a).slice(0, 3).map(([c]) => c);
        return top.length > 0 ? `You favor: ${top.join(", ")}` : "Discovering your preferences...";
    } catch { return "Analyzing your preferences..."; }
}

function generateImprovementTip(total: number, unique: number, streak: number) {
    if (total === 0) return "Start selecting names to see your first tournament!";
    if (unique < 3) return "Try creating more tournaments to discover your preferences";
    if (streak < 3) return "Build a selection streak by playing daily";
    return "Great job! You're an active tournament participant";
}

// ============================================================================
// Name Operations (from useProfileNameOperations)
// ============================================================================

export async function toggleNameVisibility(userName: string, nameId: string, currentlyHidden: boolean) {
    if (currentlyHidden) return await hiddenNamesAPI.unhideName(userName, nameId);
    return await hiddenNamesAPI.hideName(userName, nameId);
}

export async function bulkNameVisibility(userName: string, nameIds: string[], isHide: boolean) {
    if (isHide) return await hiddenNamesAPI.hideNames(userName, nameIds);
    return await hiddenNamesAPI.unhideNames(userName, nameIds);
}

export async function deleteProfileName(nameId: string) {
    return await deleteName(nameId);
}

// ============================================================================
// User Management (from useProfileUser)
// ============================================================================

export async function listAllUsers(): Promise<UserWithRoles[]> {
    try {
        const users = await adminAPI.listUsers();
        return (users || []) as UserWithRoles[];
    } catch (error) {
        devError("Error listing users:", error);
        return [];
    }
}
