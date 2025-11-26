/**
 * @module profileStats
 * @description Utility functions for calculating profile statistics and insights.
 */

import { resolveSupabaseClient } from "../../../shared/services/supabase/client";
import {
  getUserStats,
  tournamentsAPI,
} from "../../../shared/services/supabase/api";

/**
 * * Use database-optimized stats calculation
 * @param {string} userName - User name to fetch stats for
 * @returns {Promise<Object|null>} User stats or null
 */
export async function fetchUserStatsFromDB(userName) {
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

/**
 * * Generate selection pattern insights
 * @param {Array} selections - Array of selection objects
 * @returns {string} Selection pattern description
 */
function generateSelectionPattern(selections) {
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
async function generatePreferredCategories(selections) {
  try {
    const nameIds = selections.map((s) => s.name_id);
    const supabaseClient = await resolveSupabaseClient();

    if (!supabaseClient) {
      return "Analyzing your preferences...";
    }

    const { data: names, error } = await supabaseClient
      .from("cat_name_options")
      .select("categories")
      .in("id", nameIds);

    if (error || !names) return "Analyzing your preferences...";

    const categoryCounts = {};
    names.forEach((name) => {
      if (name.categories && Array.isArray(name.categories)) {
        name.categories.forEach((cat) => {
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });
      }
    });

    const topCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([cat]) => cat);

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
  totalSelections,
  totalTournaments,
  currentStreak,
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
 * * Calculate selection analytics using consolidated tournament_data in cat_app_users
 * @param {string} userName - User name to calculate stats for
 * @returns {Promise<Object|null>} Selection statistics or null
 */
export async function calculateSelectionStats(userName) {
  try {
    if (!(await resolveSupabaseClient())) return null;

    // Pull tournaments from cat_app_users.tournament_data via API
    const tournaments = await tournamentsAPI.getUserTournaments(userName);
    if (!tournaments || tournaments.length === 0) {
      return null;
    }

    // Flatten selections from tournament_data
    const selections = tournaments.flatMap((t) =>
      (t.selected_names || []).map((n) => ({
        name_id: n.id,
        name: n.name,
        tournament_id: t.id,
        selected_at: t.created_at,
      })),
    );

    // Calculate basic metrics
    const totalSelections = selections.length;
    const totalTournaments = tournaments.length;
    const uniqueNames = new Set(selections.map((s) => s.name_id)).size;
    const avgSelectionsPerName =
      uniqueNames > 0
        ? Math.round((totalSelections / uniqueNames) * 10) / 10
        : 0;

    // Find most selected name and build per-name selection data
    const nameCounts = {};
    const nameSelectionCounts = {}; // Per name_id selection counts
    const nameLastSelected = {}; // Per name_id last selected date
    const nameSelectionFrequency = {}; // Per name_id selection frequency

    selections.forEach((s) => {
      // Count by name (for most selected)
      nameCounts[s.name] = (nameCounts[s.name] || 0) + 1;

      // Count by name_id (for filtering)
      nameSelectionCounts[s.name_id] =
        (nameSelectionCounts[s.name_id] || 0) + 1;

      // Track last selected date per name_id
      const selectedDate = s.selected_at ? new Date(s.selected_at) : null;
      if (
        selectedDate &&
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
        totalTournaments > 0
          ? Math.round((count / totalTournaments) * 100) / 100
          : 0;
    });

    const mostSelectedName =
      Object.entries(nameCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A";

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
        const prevDate = new Date(sortedSelections[i - 1]);
        const currDate = new Date(sortedSelections[i]);
        const dayDiff = Math.floor(
          (currDate - prevDate) / (1000 * 60 * 60 * 24),
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

    // Generate insights
    const insights = {
      selectionPattern: generateSelectionPattern(selections),
      preferredCategories: await generatePreferredCategories(selections),
      improvementTip: generateImprovementTip(
        totalSelections,
        totalTournaments,
        currentStreak,
      ),
    };

    return {
      totalSelections,
      totalTournaments,
      avgSelectionsPerName,
      mostSelectedName,
      currentStreak,
      maxStreak,
      userRank: userRank || "N/A",
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
