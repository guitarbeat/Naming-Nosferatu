/**
 * @module profileStats
 * @description Utility functions for calculating profile statistics and insights.
 */

import { resolveSupabaseClient } from "../../../shared/services/supabase/client";
import { getUserStats } from "../../../shared/services/supabase/api";

/**
 * * Use database-optimized stats calculation
 * @param {string|null} userName - User name to fetch stats for, or null for aggregate stats from all users
 * @returns {Promise<Object|null>} User stats or aggregate stats or null
 */
export async function fetchUserStatsFromDB(userName: string | null) {
  // * If userName is null, calculate aggregate stats from all users
  if (userName === null) {
    try {
      const supabaseClient = await resolveSupabaseClient();
      if (!supabaseClient) return null;

      // * Fetch aggregate stats from all users
      const { data: ratings, error: ratingsError } = await supabaseClient
        .from("cat_name_ratings")
        .select("rating, wins, losses, user_name");

      if (ratingsError) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error fetching aggregate ratings:", ratingsError);
        }
        return null;
      }

      const { data: selections, error: selectionsError } = await supabaseClient
        .from("tournament_selections")
        .select("user_name, tournament_id");

      if (selectionsError) {
        if (process.env.NODE_ENV === "development") {
          console.error(
            "Error fetching aggregate selections:",
            selectionsError,
          );
        }
        return null;
      }

      // * Calculate aggregate metrics
      const totalRatings = ratings?.length || 0;
      const totalWins =
        ratings?.reduce((sum, r) => sum + (r.wins || 0), 0) || 0;
      const totalLosses =
        ratings?.reduce((sum, r) => sum + (r.losses || 0), 0) || 0;
      const avgRating =
        totalRatings > 0
          ? Math.round(
              ratings.reduce((sum, r) => sum + (r.rating || 1500), 0) /
                totalRatings,
            )
          : 1500;
      const uniqueUsers = new Set([
        ...(ratings?.map((r) => r.user_name) || []),
        ...(selections?.map((s) => s.user_name) || []),
      ]).size;
      const totalTournaments = new Set(
        selections?.map((s) => s.tournament_id) || [],
      ).size;
      const totalSelections = selections?.length || 0;

      return {
        names_rated: totalRatings,
        active_ratings: totalRatings,
        hidden_ratings: 0,
        avg_rating_given: avgRating,
        total_wins: totalWins,
        total_losses: totalLosses,
        total_tournaments: totalTournaments,
        total_selections: totalSelections,
        unique_users: uniqueUsers,
        is_aggregate: true,
      };
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error calculating aggregate stats:", error);
      }
      return null;
    }
  }

  if (!userName) return null;

  if (!(await resolveSupabaseClient())) {
    return null;
  }

  try {
    const dbStats = await getUserStats(userName);
    if (!dbStats) return null;

    // Return database stats directly (no transformation needed)
    return dbStats;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching user stats from DB:", error);
    }
    return null;
  }
}

interface Selection {
  tournament_id: string;
  name_id?: string | number;
  selected_at?: string;
}

/**
 * * Generate selection pattern insights
 * @param {Array} selections - Array of selection objects
 * @returns {string} Selection pattern description
 */
function generateSelectionPattern(selections: Selection[]) {
  if (!selections || selections.length === 0)
    return "No selection data available";

  const totalSelections = selections.length;
  const uniqueTournaments = new Set(selections.map((s) => s.tournament_id))
    .size;
  const avgSelectionsPerTournament =
    Math.round((totalSelections / uniqueTournaments) * 10) / 10;

  if (avgSelectionsPerTournament > 8) {
    return "You prefer large tournaments with many names";
  } else if (avgSelectionsPerTournament > 4) {
    return "You enjoy medium-sized tournaments";
  } else {
    return "You prefer focused, smaller tournaments";
  }
}

/**
 * * Generate preferred categories insight
 * @param {Array} selections - Array of selection objects
 * @returns {Promise<string>} Preferred categories description
 */
async function generatePreferredCategories(selections: Selection[]) {
  try {
    const nameIds = selections
      .map((s) => s.name_id)
      .filter((id): id is string | number =>
        id !== undefined && id !== null && (typeof id === "string" || typeof id === "number")
      );
    const supabaseClient = await resolveSupabaseClient();

    if (!supabaseClient || nameIds.length === 0) {
      return "Analyzing your preferences...";
    }

    // Convert all IDs to strings for Supabase query (Supabase .in() expects string[])
    const stringIds = nameIds.map((id) => String(id));

    const { data: names, error } = await supabaseClient
      .from("cat_name_options")
      .select("categories")
      .in("id", stringIds);

    if (error || !names) return "Analyzing your preferences...";

    const categoryCounts: Record<string, number> = {};
    names.forEach((name) => {
      if (name.categories && Array.isArray(name.categories)) {
        name.categories.forEach((cat: string) => {
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });
      }
    });

    const topCategories: string[] = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([cat]) => cat)
      .filter((cat: string | undefined): cat is string => typeof cat === "string");

    if (topCategories.length > 0) {
      return `You favor: ${topCategories.join(", ")}`;
    }

    return "Discovering your preferences...";
  } catch {
    return "Analyzing your preferences...";
  }
}

/**
 * * Generate improvement tips
 * @param {number} totalSelections - Total number of selections
 * @param {number} totalTournaments - Total number of tournaments
 * @param {number} currentStreak - Current selection streak
 * @returns {string} Improvement tip
 */
function generateImprovementTip(
  totalSelections: number,
  totalTournaments: number,
  currentStreak: number,
) {
  if (totalSelections === 0) {
    return "Start selecting names to see your first tournament!";
  }

  if (totalTournaments < 3) {
    return "Try creating more tournaments to discover your preferences";
  }

  if (currentStreak < 3) {
    return "Build a selection streak by playing daily";
  }

  if (totalSelections / totalTournaments < 4) {
    return "Consider selecting more names per tournament for variety";
  }

  return "Great job! You're an active tournament participant";
}

/**
 * * Calculate selection analytics using tournament_selections table
 * @param {string|null} userName - User name to calculate stats for, or null for aggregate stats from all users
 * @returns {Promise<Object|null>} Selection statistics or null
 */
export async function calculateSelectionStats(userName: string | null) {
  try {
    const supabaseClient = await resolveSupabaseClient();
    if (!supabaseClient) return null;

    // * Build query - if userName is null, fetch all selections (aggregate)
    let selectionsQuery = supabaseClient
      .from("tournament_selections")
      .select("name_id, name, tournament_id, selected_at, user_name");

    if (userName !== null) {
      selectionsQuery = selectionsQuery.eq("user_name", userName);
    }

    const { data: selections, error } = await selectionsQuery.order(
      "selected_at",
      { ascending: false },
    );

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching tournament selections:", error);
      }
      return null;
    }

    if (!selections || selections.length === 0) {
      return null;
    }

    // * Calculate basic metrics
    const totalSelections = selections.length;
    const uniqueTournaments = new Set(selections.map((s) => s.tournament_id))
      .size;
    const uniqueNames = new Set(selections.map((s) => s.name_id)).size;
    const uniqueUsers =
      userName === null ? new Set(selections.map((s) => s.user_name)).size : 1;
    const avgSelectionsPerName =
      uniqueNames > 0
        ? Math.round((totalSelections / uniqueNames) * 10) / 10
        : 0;

    // Find most selected name and build per-name selection data
    const nameCounts: Record<string, number> = {};
    const nameSelectionCounts: Record<string, number> = {}; // Per name_id selection counts
    const nameLastSelected: Record<string, string> = {}; // Per name_id last selected date
    const nameSelectionFrequency: Record<string, number> = {}; // Per name_id selection frequency

    selections.forEach((s) => {
      // Count by name (for most selected)
      const { name } = s as Selection & { name?: string };
      if (name) {
        nameCounts[name] = (nameCounts[name] || 0) + 1;
      }

      // Count by name_id (for filtering)
      if (s.name_id) {
        nameSelectionCounts[s.name_id] =
          (nameSelectionCounts[s.name_id] || 0) + 1;
      }

      // Track last selected date per name_id
      const selectedDate = s.selected_at ? new Date(s.selected_at) : null;
      if (
        selectedDate &&
        s.name_id &&
        (!nameLastSelected[s.name_id] ||
          selectedDate > new Date(nameLastSelected[s.name_id]))
      ) {
        nameLastSelected[s.name_id] = s.selected_at;
      }
    });

    // Calculate selection frequency (selections per tournament for each name)
    Object.keys(nameSelectionCounts).forEach((nameId) => {
      const count = nameSelectionCounts[nameId];
      nameSelectionFrequency[nameId] =
        uniqueTournaments > 0
          ? Math.round((count / uniqueTournaments) * 100) / 100
          : 0;
    });

    const mostSelectedName =
      Object.entries(nameCounts).sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] || "N/A";

    // Calculate selection streak (consecutive days)
    const sortedSelections = selections
      .map((s) => new Date(s.selected_at || Date.now()).toDateString())
      .sort()
      .filter((date, index, arr) => index === 0 || date !== arr[index - 1]);

    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;

    for (let i = 0; i < sortedSelections.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(sortedSelections[i - 1] as string);
        const currDate = new Date(sortedSelections[i] as string);
        const dayDiff = Math.floor(
          (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (dayDiff === 1) {
          tempStreak++;
        } else {
          maxStreak = Math.max(maxStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    maxStreak = Math.max(maxStreak, tempStreak);
    currentStreak = tempStreak;

    // Cross-user ranking not supported without a view; omit
    const userRank = "N/A";

    // * Generate insights - adjust for aggregate vs individual user
    const isAggregate = userName === null;
    const insights = isAggregate
      ? {
          selectionPattern: "Aggregate data from all users",
          preferredCategories: await generatePreferredCategories(selections),
          improvementTip: `Total activity across ${uniqueUsers || 0} users`,
        }
      : {
          selectionPattern: generateSelectionPattern(selections),
          preferredCategories: await generatePreferredCategories(selections),
          improvementTip: generateImprovementTip(
            totalSelections,
            uniqueTournaments,
            currentStreak,
          ),
        };

    return {
      totalSelections,
      totalTournaments: uniqueTournaments,
      avgSelectionsPerName,
      mostSelectedName,
      currentStreak: userName === null ? 0 : currentStreak, // Streaks don't apply to aggregate
      maxStreak: userName === null ? 0 : maxStreak, // Streaks don't apply to aggregate
      userRank: userRank || "N/A",
      uniqueUsers: userName === null ? uniqueUsers : 1,
      isAggregate: userName === null,
      insights,
      // * Per-name selection data for filtering
      nameSelectionCounts, // Map of name_id -> selection count
      nameLastSelected, // Map of name_id -> last selected timestamp
      nameSelectionFrequency, // Map of name_id -> selection frequency (selections per tournament)
    };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error calculating selection stats:", error);
    }
    return null;
  }
}
