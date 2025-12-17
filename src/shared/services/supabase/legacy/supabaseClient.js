/**
 * @module supabaseClient
 * @description Consolidated Supabase client with unified API for cat name tournament system.
 * Combines all database operations, real-time subscriptions, and utility functions.
 * * Uses the centralized client from client.ts
 */

import { resolveSupabaseClient } from "../client";

// * Development mode check (browser-compatible)
const isDev =
  typeof process !== "undefined" && process.env?.NODE_ENV === "development";

// ===== HELPER FUNCTIONS =====

/**
 * Check if Supabase is configured and available
 * @returns {boolean} True if Supabase is available
 */
const isSupabaseAvailable = async () => {
  // * Try to resolve client
  const client = await resolveSupabaseClient();
  if (!client) {
    if (isDev) {
      console.warn("Supabase not configured. Some features may not work.");
    }
    return false;
  }
  return true;
};

// ===== CORE API FUNCTIONS =====

/**
 * Cat Names Management
 */
export const catNamesAPI = {
  /**
   * Get all names with descriptions and ratings
   * @param {boolean} includeHidden - If true, include hidden names (for admin views)
   */
  async getNamesWithDescriptions(includeHidden = false) {
    try {
      // * Get the Supabase client (reuses existing instance)
      const client = await resolveSupabaseClient();

      if (!client) {
        if (isDev) {
          console.warn("Supabase not available, using fallback names");
        }
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
          {
            id: "fix",
            name: "fix",
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
          {
            id: "the",
            name: "the",
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
          {
            id: "whiskers",
            name: "whiskers",
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
          {
            id: "shadow",
            name: "shadow",
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
          {
            id: "luna",
            name: "luna",
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
          {
            id: "felix",
            name: "felix",
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
          {
            id: "milo",
            name: "milo",
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

      // Build query - filter out globally hidden names directly from cat_name_options.is_hidden
      // This is more efficient than a separate query to cat_name_ratings
      // Only select columns that exist in the schema
      // Build query - optionally include hidden names for admin views
      let query = client
        .from("cat_name_options")
        .select(
          `
        id,
        name,
        description,
        created_at,
        avg_rating,
        is_active,
        is_hidden
      `,
        )
        .eq("is_active", true)
        .order("avg_rating", { ascending: false });

      // Only filter out hidden names if not requesting them
      if (!includeHidden) {
        query = query.eq("is_hidden", false);
      }

      const { data, error } = await query;

      // Count hidden names for logging
      const { count: hiddenCount } = await client
        .from("cat_name_options")
        .select("id", { count: "exact", head: true })
        .eq("is_hidden", true);
      if (error) {
        console.error("Error fetching names with descriptions:", error);
        console.error("Query details:", {
          table: "cat_name_options",
          filter: "is_active = true, is_hidden = false",
          errorCode: error.code,
          errorMessage: error.message,
        });
        return [];
      }

      if (isDev) {
        console.log("Names query result:", {
          totalNames: data?.length || 0,
          hiddenNames: hiddenCount || 0,
          hasActiveNames: data?.some((name) => name.is_active) || false,
        });
      }

      // * If no active names found, return fallback names
      if (!data || data.length === 0) {
        console.warn("No active names found in database, using fallback names");
        return [
          {
            id: "aaron",
            name: "aaron",
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
          },
          {
            id: "fix",
            name: "fix",
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
          },
          {
            id: "the",
            name: "the",
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
          },
          {
            id: "whiskers",
            name: "whiskers",
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
          },
          {
            id: "shadow",
            name: "shadow",
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
          },
          {
            id: "luna",
            name: "luna",
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
          },
          {
            id: "felix",
            name: "felix",
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
          },
          {
            id: "milo",
            name: "milo",
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
          },
        ];
      }

      // Process data to include default values (no user-specific data in this view)
      return (data || []).map((item) => ({
        ...item,
        updated_at: null,
        user_rating: null,
        user_wins: 0,
        user_losses: 0,
        isHidden: false,
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
   * @param {string} name - The name to add
   * @param {string} description - The description for the name
   * @param {string} [userName] - Optional user name to set context for RLS policies
   */
  async addName(name, description = "", userName = null) {
    try {
      if (!(await isSupabaseAvailable())) {
        return { success: false, error: "Supabase not configured" };
      }

      const client = await resolveSupabaseClient();

      // * Set user context for RLS policies if userName is provided
      if (userName && userName.trim()) {
        try {
          await client.rpc("set_user_context", {
            user_name_param: userName.trim(),
          });
        } catch (rpcError) {
          // * Log but don't fail if RPC is unavailable (some environments may not support it)
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
        error: error.message || "Unknown error occurred",
      };
    }
  },

  /**
   * Remove a name option
   */
  async removeName(name) {
    try {
      if (!(await isSupabaseAvailable())) {
        return { success: false, error: "Supabase not configured" };
      }

      const client = await resolveSupabaseClient();
      if (!client) {
        return { success: false, error: "Supabase not configured" };
      }

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
        error: error.message || "Unknown error occurred",
      };
    }
  },

  /**
   * Get leaderboard data using optimized direct queries with covering indexes
   */
  async getLeaderboard(limit = 50, categoryId = null, _minTournaments = 3) {
    try {
      if (!(await isSupabaseAvailable())) {
        return [];
      }

      // Apply category filter if provided
      if (categoryId) {
        const client = await resolveSupabaseClient();
        if (!client) return [];
        const { data: topNames, error: categoryError } = await client.rpc(
          "get_top_names_by_category",
          {
            p_category: categoryId,
            p_limit: limit,
          },
        );

        if (categoryError) {
          console.error("Error fetching category leaderboard:", categoryError);
          return [];
        }
        return topNames || [];
      }

      // Get names with their aggregated rating stats from cat_name_ratings
      // This gives us actual user-submitted ratings, not just defaults
      const client = await resolveSupabaseClient();
      if (!client) return [];
      const { data: ratingStats, error: ratingError } = await client
        .from("cat_name_ratings")
        .select("name_id, rating, wins, losses");

      if (ratingError) {
        console.error("Error fetching rating stats:", ratingError);
      }

      // Aggregate ratings by name_id
      const nameStats = new Map();
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
        stats.totalRating += Number(r.rating) || 1500;
        stats.count += 1;
        stats.totalWins += r.wins || 0;
        stats.totalLosses += r.losses || 0;
      });

      // Get name details from cat_name_options
      let query = client
        .from("cat_name_options")
        .select("id, name, description, avg_rating, categories, created_at")
        .eq("is_active", true)
        .eq("is_hidden", false)
        .order("avg_rating", { ascending: false });

      // * Only apply limit if specified (null means get all)
      if (limit) {
        query = query.limit(limit * 2);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching leaderboard:", error);
        return [];
      }

      // Combine and sort by actual average rating
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
        .filter((row) => row.total_ratings > 0 || row.avg_rating > 1500) // Only names with actual ratings
        .sort((a, b) => b.avg_rating - a.avg_rating);

      // * Only apply slice if limit is specified (null means get all)
      if (limit) {
        return leaderboard.slice(0, limit);
      }

      return leaderboard;
    } catch (error) {
      if (isDev) {
        console.error("Error fetching leaderboard:", error);
      }
      return [];
    }
  },

  /**
   * Get selection popularity - which names are most frequently chosen for tournaments
   * @param {number} limit - Maximum number of results
   * @returns {Array} Names sorted by selection count
   */
  async getSelectionPopularity(limit = 20) {
    try {
      if (!(await isSupabaseAvailable())) {
        return [];
      }

      // Query tournament_selections to get selection counts per name
      const client = await resolveSupabaseClient();
      if (!client) return [];
      const { data, error } = await client
        .from("tournament_selections")
        .select("name_id, name");

      if (error) {
        console.error("Error fetching selection popularity:", error);
        return [];
      }

      // Aggregate selections by name
      const selectionCounts = new Map();

      (data || []).forEach((row) => {
        const key = row.name_id;
        if (!selectionCounts.has(key)) {
          selectionCounts.set(key, { name_id: key, name: row.name, count: 0 });
        }
        selectionCounts.get(key).count += 1;
      });

      // Convert to array and sort by count
      let results = Array.from(selectionCounts.values()).sort(
        (a, b) => b.count - a.count,
      );

      // * Only apply limit if specified (null means get all)
      if (limit) {
        results = results.slice(0, limit);
      }

      return results.map((item) => ({
        name_id: item.name_id,
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
   * Get comprehensive popularity analytics for admin dashboard
   * Combines selection frequency, ratings, wins, and user engagement
   * @param {number} limit - Maximum number of results
   * @param {string|null} userFilter - Filter by user: "all" (aggregate all users), "current" (current user), or specific username
   * @param {string|null} currentUserName - Current user name (required if userFilter is "current")
   * @returns {Array} Names with full popularity metrics
   */
  async getPopularityAnalytics(
    limit = 20,
    userFilter = "all",
    currentUserName = null,
  ) {
    try {
      if (!(await isSupabaseAvailable())) {
        return [];
      }

      const client = await resolveSupabaseClient();
      if (!client) return [];

      // * Determine which users to include
      let selectionsQuery = client
        .from("tournament_selections")
        .select("name_id, name, user_name");
      let ratingsQuery = client
        .from("cat_name_ratings")
        .select("name_id, rating, wins, losses, user_name");

      // * Apply user filter
      if (userFilter && userFilter !== "all") {
        const targetUser =
          userFilter === "current" ? currentUserName : userFilter;
        if (targetUser) {
          selectionsQuery = selectionsQuery.eq("user_name", targetUser);
          ratingsQuery = ratingsQuery.eq("user_name", targetUser);
        }
      }

      // Fetch all data in parallel for efficiency
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

      // Build selection stats
      const selectionStats = new Map();
      selections.forEach((s) => {
        if (!selectionStats.has(s.name_id)) {
          selectionStats.set(s.name_id, { count: 0, users: new Set() });
        }
        const stat = selectionStats.get(s.name_id);
        stat.count += 1;
        stat.users.add(s.user_name);
      });

      // Build rating stats
      const ratingStats = new Map();
      ratings.forEach((r) => {
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
        stat.totalRating += Number(r.rating) || 1500;
        stat.count += 1;
        stat.wins += r.wins || 0;
        stat.losses += r.losses || 0;
        stat.users.add(r.user_name);
      });

      // Combine into popularity analytics
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

        // Popularity score: weighted combination
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

      // Sort by popularity score and return top results
      const sorted = analytics.sort(
        (a, b) => b.popularity_score - a.popularity_score,
      );

      // * Only apply limit if specified (null means get all)
      if (limit) {
        return sorted.slice(0, limit);
      }

      return sorted;
    } catch (error) {
      if (isDev) {
        console.error("Error fetching popularity analytics:", error);
      }
      return [];
    }
  },

  /**
   * Get global site statistics for admin dashboard
   * @returns {Object} Site-wide metrics
   */
  async getSiteStats() {
    try {
      const client = await resolveSupabaseClient();
      if (!client) {
        return null;
      }

      // Fetch all counts in parallel
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

      // Calculate rating stats
      const ratings = ratingsResult.data || [];
      const totalRatings = ratings.length;
      const avgRating =
        totalRatings > 0
          ? Math.round(
              ratings.reduce((sum, r) => sum + Number(r.rating), 0) /
                totalRatings,
            )
          : 1500;

      // Find names never selected
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
        totalRatings,
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
   * Get comprehensive user statistics using optimized database function
   */
  async getUserStats(userName) {
    try {
      if (!(await isSupabaseAvailable())) {
        return null;
      }

      const client = await resolveSupabaseClient();
      if (!client) return null;
      const { data, error } = await client.rpc("get_user_stats", {
        p_user_name: userName,
      });

      if (error) {
        console.error("Error fetching user stats:", error);
        return null;
      }

      // Return first row (function returns single row)
      return data?.[0] || null;
    } catch (error) {
      console.error("Error fetching user stats:", error);
      return null;
    }
  },

  /**
   * Get all names with user-specific ratings, statistics, and selection counts
   */
  async getNamesWithUserRatings(userName) {
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

      // Get all names with user-specific ratings
      // Global hidden status is on cat_name_options.is_hidden
      const client = await resolveSupabaseClient();
      if (!client) return [];
      const { data, error } = await client
        .from("cat_name_options")
        .select(
          `
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
        `,
        )
        .eq("is_active", true)
        .order("name");

      if (error) {
        console.error("Error fetching names with user ratings:", error);
        return [];
      }

      // Fetch selection counts for all names
      const { data: selectionData } = await client
        .from("tournament_selections")
        .select("name_id");

      // Build selection count map
      const selectionCounts = new Map();
      (selectionData || []).forEach((row) => {
        const count = selectionCounts.get(row.name_id) || 0;
        selectionCounts.set(row.name_id, count + 1);
      });

      // Process data to include user-specific ratings and selection counts
      return (
        data?.map((item) => {
          // * Find user-specific rating data
          const userRating = item.cat_name_ratings?.find(
            (r) => r.user_name === userName,
          );

          // * Global hidden status from cat_name_options.is_hidden
          const isHidden = item.is_hidden === true;

          // * Debug logging for hidden names
          if (isDev && isHidden) {
            console.log(
              `🔍 Found globally hidden name: ${item.name} (${item.id})`,
              { isHidden },
            );
          }

          return {
            ...item,
            popularity_score: 0, // Not tracked anymore
            total_tournaments: 0, // Not tracked anymore
            times_selected: selectionCounts.get(item.id) || 0,
            user_rating: userRating?.rating || null,
            user_wins: userRating?.wins || 0,
            user_losses: userRating?.losses || 0,
            isHidden,
            updated_at: userRating?.updated_at || null,
            has_user_rating: !!userRating?.rating,
          };
        }) || []
      );
    } catch (error) {
      if (isDev) {
        console.error("Error fetching names with user ratings:", error);
      }
      return [];
    }
  },

  /**
   * Get meaningful user statistics for profile page (Fallback implementation)
   * @private
   */
  async _getUserStatsFallback(userName) {
    try {
      if (!(await isSupabaseAvailable())) {
        return {
          names_rated: 0,
          active_ratings: 0,
          hidden_ratings: 0,
          avg_rating_given: 0,
          min_rating_given: 0,
          max_rating_given: 0,
          high_ratings: 0,
          low_ratings: 0,
          total_selections: 0,
          tournaments_participated: 0,
          unique_names_selected: 0,
          most_selected_name: "None",
          first_selection: null,
          last_selection: null,
        };
      }

      // Get user rating statistics
      const client = await resolveSupabaseClient();
      if (!client) return null;

      const { data: ratingStats, error: ratingError } = await client
        .from("cat_name_ratings")
        .select("rating, is_hidden")
        .eq("user_name", userName);

      if (ratingError) {
        console.error("Error fetching user rating stats:", ratingError);
        return null;
      }

      // Get tournament selection statistics
      const { data: selectionStats, error: selectionError } = await client
        .from("tournament_selections")
        .select("name_id, tournament_id, selected_at, name")
        .eq("user_name", userName);

      if (selectionError) {
        console.error("Error fetching selection stats:", selectionError);
        return null;
      }

      // Calculate rating statistics
      const ratings = ratingStats || [];
      const activeRatings = ratings.filter((r) => !r.is_hidden);
      const hiddenRatings = ratings.filter((r) => r.is_hidden);
      const ratingValues = ratings
        .map((r) => r.rating)
        .filter((r) => r != null);

      const avgRating =
        ratingValues.length > 0
          ? ratingValues.reduce((sum, r) => sum + r, 0) / ratingValues.length
          : 0;

      const minRating = ratingValues.length > 0 ? Math.min(...ratingValues) : 0;
      const maxRating = ratingValues.length > 0 ? Math.max(...ratingValues) : 0;
      const highRatings = ratingValues.filter((r) => r >= 1500).length;
      const lowRatings = ratingValues.filter((r) => r < 1000).length;

      // Calculate selection statistics
      const selections = selectionStats || [];
      const uniqueTournaments = new Set(selections.map((s) => s.tournament_id))
        .size;
      const uniqueNames = new Set(selections.map((s) => s.name_id)).size;

      // Find most selected name
      const nameCounts = {};
      selections.forEach((s) => {
        nameCounts[s.name] = (nameCounts[s.name] || 0) + 1;
      });
      const mostSelected =
        Object.keys(nameCounts).length > 0
          ? Object.entries(nameCounts).reduce((a, b) =>
              a[1] > b[1] ? a : b,
            )[0]
          : "None";

      const firstSelection =
        selections.length > 0
          ? Math.min(
              ...selections.map((s) => new Date(s.selected_at).getTime()),
            )
          : null;
      const lastSelection =
        selections.length > 0
          ? Math.max(
              ...selections.map((s) => new Date(s.selected_at).getTime()),
            )
          : null;

      return {
        names_rated: ratings.length,
        active_ratings: activeRatings.length,
        hidden_ratings: hiddenRatings.length,
        avg_rating_given: avgRating,
        min_rating_given: minRating,
        max_rating_given: maxRating,
        high_ratings: highRatings,
        low_ratings: lowRatings,
        total_selections: selections.length,
        tournaments_participated: uniqueTournaments,
        unique_names_selected: uniqueNames,
        most_selected_name: mostSelected,
        first_selection: firstSelection
          ? new Date(firstSelection).toISOString()
          : null,
        last_selection: lastSelection
          ? new Date(lastSelection).toISOString()
          : null,
      };
    } catch (error) {
      if (isDev) {
        console.error("Error fetching user stats:", error);
      }
      return null;
    }
  },

  /**
   * Get Aaron's top names with his ratings
   */
  async getAaronsTopNames(limit = 10) {
    try {
      if (!(await isSupabaseAvailable())) {
        return [];
      }

      // Get names with Aaron's ratings, ordered by his rating (highest first)
      // Only select columns that exist in the schema
      const client = await resolveSupabaseClient();
      if (!client) return [];
      const { data, error } = await client
        .from("cat_name_options")
        .select(
          `
          id,
          name,
          description,
          created_at,
          avg_rating,
          is_active,
          is_hidden,
          cat_name_ratings!inner (
            user_name,
            rating,
            wins,
            losses,
            updated_at
          )
        `,
        )
        .eq("cat_name_ratings.user_name", "aaron")
        .not("cat_name_ratings.rating", "is", null)
        .order("cat_name_ratings.rating", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching Aaron's top names:", error);
        return [];
      }

      // Process data to include Aaron's specific ratings
      return (
        data?.map((item) => ({
          ...item,
          popularity_score: 0, // Not tracked anymore
          total_tournaments: 0, // Not tracked anymore
          user_rating: item.cat_name_ratings[0]?.rating || 0,
          user_wins: item.cat_name_ratings[0]?.wins || 0,
          user_losses: item.cat_name_ratings[0]?.losses || 0,
          updated_at: item.cat_name_ratings[0]?.updated_at || null,
          isHidden: item.is_hidden || false,
          has_user_rating: true,
        })) || []
      );
    } catch (error) {
      if (isDev) {
        console.error("Error fetching Aaron's top names:", error);
      }
      return [];
    }
  },

  /**
   * Get ranking history data for bump chart visualization
   * Tracks how names have moved in rankings over recent time periods
   * @param {number} topN - Number of top names to track
   * @param {number} periods - Number of time periods to show
   * @param {Object} [options] - Optional filters (e.g., dateFilter)
   * @param {string} [options.dateFilter] - Date range filter key
   * @returns {Object} { data: Array, timeLabels: Array }
   */
  async getRankingHistory(topN = 10, periods = 7, options = {}) {
    try {
      if (!(await isSupabaseAvailable())) {
        return { data: [], timeLabels: [] };
      }

      const client = await resolveSupabaseClient();
      if (!client) return { data: [], timeLabels: [] };

      const dateFilterPeriods = {
        today: 2,
        week: 7,
        month: 30,
        year: 365,
        all: periods,
      };
      const requestedPeriods =
        options?.periods ?? dateFilterPeriods[options?.dateFilter] ?? periods;
      const periodCount = Math.max(requestedPeriods, 2);

      // Get selection data grouped by date for the last N periods
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

      // Get current ratings for reference
      const { data: ratings } = await client
        .from("cat_name_ratings")
        .select("name_id, rating, wins");

      // Build rating map
      const ratingMap = new Map();
      (ratings || []).forEach((r) => {
        const existing = ratingMap.get(r.name_id);
        if (!existing || r.rating > existing.rating) {
          ratingMap.set(r.name_id, { rating: r.rating, wins: r.wins || 0 });
        }
      });

      // Group selections by date and name
      const dateGroups = new Map();
      const nameData = new Map();

      (selections || []).forEach((s) => {
        const [date] = new Date(s.selected_at).toISOString().split("T");

        if (!dateGroups.has(date)) {
          dateGroups.set(date, new Map());
        }
        const dayMap = dateGroups.get(date);

        if (!dayMap.has(s.name_id)) {
          dayMap.set(s.name_id, { name: s.name, count: 0 });
        }
        dayMap.get(s.name_id).count += 1;

        // Track name metadata
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
        nameData.get(s.name_id).totalSelections += 1;
      });

      // Generate time labels for the last N days
      const timeLabels = [];
      const today = new Date();
      for (let i = periodCount - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const label = d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        timeLabels.push(label);
      }

      // Calculate rankings for each day
      const dateKeys = [];
      for (let i = periodCount - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const [date] = d.toISOString().split("T");
        dateKeys.push(date);
      }

      // Get top names by total selections
      const sortedNames = Array.from(nameData.values())
        .sort((a, b) => b.totalSelections - a.totalSelections)
        .slice(0, topN);

      // Build ranking data for each name
      const rankingData = sortedNames.map((nameInfo) => {
        const rankings = dateKeys.map((dateKey) => {
          const dayData = dateGroups.get(dateKey);
          if (!dayData) return null;

          // Sort all names by count for this day to get ranking
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

/**
 * Hidden Names Management
 */
const isPermissionError = (error) => {
  if (!error) return false;

  const status = error.status ?? error.statusCode;
  const code = typeof error.code === "string" ? error.code.toUpperCase() : "";
  const message = error.message?.toLowerCase?.() ?? "";

  if (status === 401 || status === 403) return true;
  if (status === 400 && message.includes("row-level security")) return true;
  if (
    code === "42501" ||
    code === "PGRST301" ||
    code === "PGRST302" ||
    code === "PGRST303"
  ) {
    return true;
  }
  if (message.includes("only admins") || message.includes("permission")) {
    return true;
  }

  return false;
};

export const hiddenNamesAPI = {
  /**
   * Hide a name globally for all users (admin only).
   */
  async hideName(userName, nameId) {
    try {
      if (!(await isSupabaseAvailable())) {
        return { success: false, error: "Supabase not configured" };
      }

      if (!nameId) {
        return { success: false, error: "Name ID is required" };
      }

      const client = await resolveSupabaseClient();
      if (!client) {
        return { success: false, error: "Supabase client unavailable" };
      }

      // * Pass username to RPC for proper admin check (case-insensitive)
      const { error } = await client.rpc("toggle_name_visibility", {
        p_name_id: nameId,
        p_hide: true,
        p_user_name: userName,
      });

      if (error) {
        if (isPermissionError(error)) {
          const permissionError = new Error("Only admins can hide names");
          permissionError.code = "NOT_ADMIN";
          permissionError.originalError = error;
          throw permissionError;
        }
        throw error;
      }

      return { success: true, scope: "global" };
    } catch (error) {
      if (isDev) {
        console.error("Error hiding name globally:", error);
      }
      throw error;
    }
  },

  /**
   * Unhide a name globally for all users (admin only).
   */
  async unhideName(userName, nameId) {
    try {
      if (!(await isSupabaseAvailable())) {
        return { success: false, error: "Supabase not configured" };
      }

      if (!nameId) {
        return { success: false, error: "Name ID is required" };
      }

      const client = await resolveSupabaseClient();
      if (!client) {
        return { success: false, error: "Supabase client unavailable" };
      }

      // * Pass username to RPC for proper admin check (case-insensitive)
      const { error } = await client.rpc("toggle_name_visibility", {
        p_name_id: nameId,
        p_hide: false,
        p_user_name: userName,
      });

      if (error) {
        if (isPermissionError(error)) {
          const permissionError = new Error("Only admins can unhide names");
          permissionError.code = "NOT_ADMIN";
          permissionError.originalError = error;
          throw permissionError;
        }
        throw error;
      }

      return { success: true, scope: "global" };
    } catch (error) {
      if (isDev) {
        console.error("Error unhiding name globally:", error);
      }
      throw error;
    }
  },

  /**
   * Hide multiple names globally (admin only)
   */
  async hideNames(userName, nameIds) {
    try {
      if (!(await isSupabaseAvailable())) {
        return { success: false, error: "Supabase not configured" };
      }

      if (!nameIds || nameIds.length === 0) {
        return { success: false, error: "No names provided", processed: 0 };
      }

      if (isDev) {
        console.log("[hiddenNamesAPI.hideNames] Starting bulk hide", {
          userName,
          nameIdsCount: nameIds.length,
          nameIds,
        });
      }

      const results = [];
      let processed = 0;
      const errors = [];

      for (const nameId of nameIds) {
        try {
          if (isDev) {
            console.log("[hiddenNamesAPI.hideNames] Hiding name:", nameId);
          }

          const result = await hiddenNamesAPI.hideName(userName, nameId);
          results.push({
            nameId,
            success: result.success,
            scope: result.scope || null,
          });
          if (result.success) {
            processed++;
          } else {
            errors.push(
              `Failed to hide ${nameId}: ${result.error || "Unknown error"}`,
            );
          }
        } catch (error) {
          const errorMsg = error.message || String(error);
          if (isDev) {
            console.error(
              `[hiddenNamesAPI.hideNames] Error hiding ${nameId}:`,
              error,
            );
          }
          results.push({ nameId, success: false, error: errorMsg });
          errors.push(`Failed to hide ${nameId}: ${errorMsg}`);
        }
      }

      if (isDev) {
        console.log("[hiddenNamesAPI.hideNames] Bulk hide complete", {
          processed,
          total: nameIds.length,
          errors: errors.length,
        });
      }

      // * Return success only if at least one name was processed
      if (processed === 0) {
        return {
          success: false,
          error:
            errors.length > 0 ? errors.join("; ") : "Failed to hide any names",
          processed: 0,
          results,
        };
      }

      return {
        success: true,
        processed,
        results,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      if (isDev) {
        console.error("[hiddenNamesAPI.hideNames] Error hiding names:", error);
      }
      throw error;
    }
  },

  /**
   * Unhide multiple names globally (admin only)
   */
  async unhideNames(userName, nameIds) {
    try {
      if (!(await isSupabaseAvailable())) {
        return { success: false, error: "Supabase not configured" };
      }

      if (!nameIds || nameIds.length === 0) {
        return { success: true, processed: 0 };
      }

      const results = [];
      let processed = 0;

      for (const nameId of nameIds) {
        try {
          const result = await hiddenNamesAPI.unhideName(userName, nameId);
          results.push({
            nameId,
            success: result.success,
            scope: result.scope || null,
          });
          if (result.success) processed++;
        } catch (error) {
          results.push({ nameId, success: false, error: error.message });
        }
      }

      return { success: true, processed, results };
    } catch (error) {
      if (isDev) {
        console.error("Error unhiding names:", error);
      }
      throw error;
    }
  },

  /**
   * Get globally hidden names (admin-set)
   */
  async getHiddenNames() {
    try {
      if (!(await isSupabaseAvailable())) {
        return [];
      }

      // Global hidden names are stored directly on cat_name_options
      const client = await resolveSupabaseClient();
      if (!client) return [];
      const { data, error } = await client
        .from("cat_name_options")
        .select("id, name, description, updated_at")
        .eq("is_hidden", true);

      if (error) throw error;

      // Transform to match expected format
      return (data || []).map((item) => ({
        name_id: item.id,
        updated_at: item.updated_at,
        cat_name_options: {
          id: item.id,
          name: item.name,
          description: item.description,
        },
      }));
    } catch (error) {
      if (isDev) {
        console.error("Error fetching hidden names:", error);
      }
      return [];
    }
  },
};

/**
 * Tournament Management
 */
export const tournamentsAPI = {
  /**
   * Create a new tournament in tournament_selections table
   * Note: This creates a tournament record. Individual selections are saved via saveTournamentSelections()
   */
  async createTournament(
    userName,
    tournamentName,
    participantNames,
    _tournamentData = {},
  ) {
    try {
      if (!(await isSupabaseAvailable())) {
        return { success: false, error: "Supabase not configured" };
      }

      // Ensure the user account exists by calling the RPC function.
      // This will create the user if they don't exist, and do nothing if they do.
      const client = await resolveSupabaseClient();
      if (!client) {
        return { success: false, error: "Supabase not configured" };
      }
      const { error: rpcError } = await client.rpc("create_user_account", {
        p_user_name: userName,
      });

      if (rpcError) {
        // Log the error for debugging, but don't throw, as the user may have been created
        // in a race condition. The subsequent logic will handle it.
        if (isDev) {
          console.warn("RPC create_user_account error (ignoring):", rpcError);
        }
      }

      // Note: The tournament_selections table structure from the migration has:
      // id, user_name, name_id, name, tournament_id, selected_at, selection_type, created_at
      // This is a per-selection table, not a per-tournament table.
      // So we just return a tournament object that can be used for tracking.
      // The actual selections will be inserted via saveTournamentSelections()

      const newTournament = {
        id: crypto.randomUUID(), // Generate unique ID
        user_name: userName,
        tournament_name: tournamentName,
        participant_names: participantNames,
        status: "in_progress",
        created_at: new Date().toISOString(),
      };

      return newTournament;
    } catch (error) {
      if (isDev) {
        console.error("Error creating tournament:", error);
      }
      throw error;
    }
  },

  /**
   * Update tournament status
   * Note: Since tournament_selections is a per-selection table, we don't have a status field per tournament.
   * This function doesn't persist to the database.
   */
  async updateTournamentStatus(tournamentId, status) {
    try {
      if (!(await isSupabaseAvailable())) {
        return { success: false, error: "Supabase not configured" };
      }

      // Check if any selections exist for this tournament
      const client = await resolveSupabaseClient();
      if (!client) {
        return { success: false, error: "Supabase not configured" };
      }
      const { data: selections, error: fetchError } = await client
        .from("tournament_selections")
        .select("user_name")
        .eq("tournament_id", tournamentId)
        .limit(1);

      if (fetchError) {
        console.error("Error fetching tournament selections:", fetchError);
        return { success: false, error: "Failed to fetch tournament data" };
      }

      if (!selections || selections.length === 0) {
        return { success: false, error: "Tournament not found" };
      }

      const updatedUser = selections[0].user_name;

      // Note: The tournament_selections table doesn't have a status field.
      // Status tracking would need to be added to the schema or handled in memory.
      // For now, we just return success.

      return {
        success: true,
        tournamentId,
        status,
        updatedUser,
        message: `Tournament status updated to ${status} (in-memory only)`,
      };
    } catch (error) {
      if (isDev) {
        console.error("Error updating tournament status:", error);
      }
      return {
        success: false,
        error: error.message || "Unknown error occurred",
      };
    }
  },

  /**
   * Get user tournaments from tournament_selections table
   * Groups selections by tournament_id to reconstruct tournament data
   */
  async getUserTournaments(userName, _status = null) {
    try {
      if (!(await isSupabaseAvailable())) {
        return [];
      }

      // Query tournament_selections - actual columns: id, user_name, name_id, name, tournament_id, selected_at, selection_type, created_at
      const client = await resolveSupabaseClient();
      if (!client) return [];
      const { data, error } = await client
        .from("tournament_selections")
        .select(
          "id, user_name, name_id, name, tournament_id, selected_at, selection_type, created_at",
        )
        .eq("user_name", userName)
        .order("created_at", { ascending: false });

      if (error) {
        // If table doesn't exist, return empty array
        if (error.code === "42P01") {
          console.warn(
            "tournament_selections table not found, returning empty array.",
          );
          return [];
        }
        throw error;
      }

      // Group selections by tournament_id to reconstruct tournaments
      const tournamentMap = new Map();
      (data || []).forEach((row) => {
        if (!tournamentMap.has(row.tournament_id)) {
          tournamentMap.set(row.tournament_id, {
            id: row.tournament_id,
            user_name: row.user_name,
            tournament_name: `Tournament ${row.tournament_id.slice(0, 8)}`,
            selected_names: [],
            participant_names: [],
            status: "completed", // Default status since table doesn't track it
            created_at: row.created_at,
            completed_at: row.selected_at,
          });
        }
        const tournament = tournamentMap.get(row.tournament_id);
        tournament.selected_names.push(row.name);
        tournament.participant_names.push({ id: row.name_id, name: row.name });
      });

      return Array.from(tournamentMap.values());
    } catch (error) {
      if (isDev) {
        console.error("Error fetching tournaments:", error);
      }
      return [];
    }
  },

  /**
   * Save tournament name selections for a user
   * @param {string} userName - The username
   * @param {Array} selectedNames - Array of name objects with id, name properties
   * @param {string} tournamentId - Optional tournament identifier
   * @returns {Object} Success status and selection count
   */
  async saveTournamentSelections(userName, selectedNames, tournamentId = null) {
    try {
      if (!(await isSupabaseAvailable())) {
        return { success: false, error: "Supabase not configured" };
      }

      const client = await resolveSupabaseClient();
      if (!client) {
        return { success: false, error: "Supabase not configured" };
      }

      // Set user context for RLS policies
      const { error: contextError } = await client.rpc("set_user_context", {
        user_name_param: userName,
      });

      if (contextError) {
        console.warn("Failed to set user context:", contextError);
        // Continue anyway - some operations may still work
      }

      const now = new Date().toISOString();
      const finalTournamentId = tournamentId || crypto.randomUUID();

      // Insert individual selections into tournament_selections table
      const selectionRecords = selectedNames.map((nameObj) => ({
        user_name: userName,
        name_id: nameObj.id,
        name: nameObj.name,
        tournament_id: finalTournamentId,
        selected_at: now,
        selection_type: "tournament_setup",
      }));

      const { error: insertError } = await client
        .from("tournament_selections")
        .insert(selectionRecords);

      if (insertError) {
        console.error("Error inserting tournament selections:", insertError);
        return {
          success: false,
          error: "Failed to save tournament selections",
        };
      }

      return {
        success: true,
        finalTournamentId,
        selectionCount: selectedNames.length,
        selectedNames: selectedNames.map((n) => n.name),
        method: "tournament_selections_table",
      };
    } catch (error) {
      if (isDev) {
        console.error("Error saving tournament selections:", error);
      }
      throw error;
    }
  },

  /**
   * Save tournament ratings to the database
   * @param {string} userName - The username
   * @param {Array} ratings - Array of rating objects with name, rating, wins, losses
   * @returns {Object} Success status and count of saved ratings
   */
  async saveTournamentRatings(userName, ratings) {
    try {
      if (!(await isSupabaseAvailable())) {
        return { success: false, error: "Supabase not configured" };
      }

      if (!userName || !ratings || ratings.length === 0) {
        return { success: false, error: "Missing userName or ratings" };
      }

      const client = await resolveSupabaseClient();
      if (!client) {
        return { success: false, error: "Supabase client unavailable" };
      }

      // Ensure user account exists (required for FK constraint)
      try {
        await client.rpc("create_user_account", {
          p_user_name: userName,
        });
      } catch (rpcError) {
        // Ignore error if user already exists
        if (isDev) {
          console.log("User account check:", rpcError?.message || "exists");
        }
      }

      // Set user context for RLS policies
      try {
        await client.rpc("set_user_context", {
          user_name_param: userName,
        });
      } catch (rpcError) {
        if (isDev) {
          console.warn("Failed to set user context for RLS:", rpcError);
        }
      }

      // First, get name IDs for all the names
      const nameStrings = ratings.map((r) => r.name);
      const { data: nameData, error: nameError } = await client
        .from("cat_name_options")
        .select("id, name")
        .in("name", nameStrings);

      if (nameError) {
        console.error("Error fetching name IDs:", nameError);
        return { success: false, error: "Failed to fetch name IDs" };
      }

      // Create a map of name -> id
      const nameToId = new Map(nameData.map((n) => [n.name, n.id]));

      // Prepare upsert records
      const now = new Date().toISOString();
      const ratingRecords = ratings
        .filter((r) => nameToId.has(r.name))
        .map((r) => ({
          user_name: userName,
          name_id: nameToId.get(r.name),
          rating: Math.min(2400, Math.max(800, Math.round(r.rating))), // Clamp to valid Elo range
          wins: r.wins || 0,
          losses: r.losses || 0,
          updated_at: now,
        }));

      if (ratingRecords.length === 0) {
        return { success: false, error: "No valid ratings to save" };
      }

      // Upsert ratings (insert or update on conflict)
      const { error: upsertError } = await client
        .from("cat_name_ratings")
        .upsert(ratingRecords, {
          onConflict: "user_name,name_id",
          ignoreDuplicates: false,
        });

      if (upsertError) {
        console.error("Error upserting ratings:", upsertError);
        return { success: false, error: upsertError.message };
      }

      // Also update the global avg_rating on cat_name_options
      // Calculate new averages for each name
      for (const record of ratingRecords) {
        const { data: avgData } = await client
          .from("cat_name_ratings")
          .select("rating")
          .eq("name_id", record.name_id);

        if (avgData && avgData.length > 0) {
          const avgRating =
            avgData.reduce((sum, r) => sum + Number(r.rating), 0) /
            avgData.length;

          await client
            .from("cat_name_options")
            .update({ avg_rating: Math.round(avgRating) })
            .eq("id", record.name_id);
        }
      }

      if (isDev) {
        console.log(
          `✅ Saved ${ratingRecords.length} ratings for user ${userName}`,
        );
      }

      return {
        success: true,
        savedCount: ratingRecords.length,
        ratings: ratingRecords,
      };
    } catch (error) {
      if (isDev) {
        console.error("Error saving tournament ratings:", error);
      }
      return { success: false, error: error.message };
    }
  },
};

// ===== UTILITY FUNCTIONS =====

/**
 * Delete a name with cascade (only if hidden)
 */
export const deleteName = async (nameId) => {
  try {
    if (!(await isSupabaseAvailable())) {
      return { success: false, error: "Supabase not configured" };
    }

    const client = await resolveSupabaseClient();
    if (!client) {
      return { success: false, error: "Supabase not configured" };
    }

    // Check if name exists
    const { data: nameData, error: nameError } = await client
      .from("cat_name_options")
      .select("name")
      .eq("id", nameId)
      .single();

    if (nameError?.code === "PGRST116") {
      throw new Error("Name has already been deleted");
    } else if (nameError) {
      throw nameError;
    }

    if (!nameData) {
      throw new Error("Name does not exist in database");
    }

    // Check if name is globally hidden (cat_name_options.is_hidden)
    const { data: nameWithHidden, error: hiddenError } = await client
      .from("cat_name_options")
      .select("is_hidden")
      .eq("id", nameId)
      .single();

    if (hiddenError) throw hiddenError;
    if (!nameWithHidden?.is_hidden) {
      throw new Error("Cannot delete name that is not hidden");
    }

    // Use transaction to delete
    const { error } = await client.rpc("delete_name_cascade", {
      target_name_id: nameId,
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    if (isDev) {
      console.error("Error in deleteName function:", error);
    }
    throw error;
  }
};

/**
 * Images (Supabase Storage)
 */
export const imagesAPI = {
  /**
   * List images from the `cat-images` bucket. Optionally from a prefix folder.
   * Deduplicates by base filename (ignoring extension) and prefers smaller files
   * when Supabase returns sizes. Otherwise, prefers modern formats (avif > webp > jpg/jpeg > png > gif).
   */
  async list(prefix = "", limit = 1000) {
    try {
      if (!(await isSupabaseAvailable())) {
        return [];
      }

      const client = await resolveSupabaseClient();
      if (!client) return [];

      const opts = {
        limit,
        search: undefined,
        sortBy: { column: "updated_at", order: "desc" },
      };
      const { data, error } = await client.storage
        .from("cat-images")
        .list(prefix, opts);
      if (error) {
        if (isDev) console.warn("imagesAPI.list error:", error);
        return [];
      }
      const files = (data || []).filter((f) => f && f.name);
      if (!files.length) return [];

      const rankByExt = (name) => {
        const n = name.toLowerCase();
        if (n.endsWith(".avif")) return 1;
        if (n.endsWith(".webp")) return 2;
        if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return 3;
        if (n.endsWith(".png")) return 4;
        if (n.endsWith(".gif")) return 5;
        return 9;
      };

      const pickSmaller = (a, b) => {
        const sizeA = a?.metadata?.size ?? a?.size;
        const sizeB = b?.metadata?.size ?? b?.size;
        if (typeof sizeA === "number" && typeof sizeB === "number") {
          return sizeA <= sizeB ? a : b;
        }
        // fallback to extension ranking
        return rankByExt(a.name) <= rankByExt(b.name) ? a : b;
      };

      const byBase = new Map();
      for (const f of files) {
        const base = f.name.replace(/\.[^.]+$/, "").toLowerCase();
        const current = byBase.get(base);
        byBase.set(base, current ? pickSmaller(current, f) : f);
      }

      // Map to public URLs
      const toUrl = (name) => {
        const fullPath = prefix ? `${prefix}/${name}` : name;
        const { data: urlData } = client.storage
          .from("cat-images")
          .getPublicUrl(fullPath);
        return urlData?.publicUrl;
      };

      return Array.from(byBase.values())
        .map((f) => toUrl(f.name))
        .filter(Boolean);
    } catch (e) {
      if (isDev) console.error("imagesAPI.list fatal:", e);
      return [];
    }
  },

  /**
   * Upload an image file to the `cat-images` bucket. Returns public URL.
   */
  async upload(file, _userName = "anon", prefix = "") {
    const client = await resolveSupabaseClient();
    if (!client) {
      throw new Error("Supabase not configured");
    }

    const safe = (file?.name || "image").replace(/[^a-zA-Z0-9._-]/g, "_");
    // Store at bucket root to simplify listing (no recursion needed)
    const objectPath = `${prefix ? `${prefix}/` : ""}${Date.now()}-${safe}`;
    const { error } = await client.storage
      .from("cat-images")
      .upload(objectPath, file, {
        upsert: false,
      });
    if (error) throw error;
    const { data } = client.storage.from("cat-images").getPublicUrl(objectPath);
    return data?.publicUrl;
  },
};
// ===== ADMIN UTILITIES =====

/**
 * Admin utilities
 */
export const adminAPI = {
  /**
   * List application users for admin tooling and auditing
   * @param {Object} [options]
   * @param {string} [options.searchTerm] Optional case-insensitive search string
   * @param {number} [options.limit=200] Maximum number of users to return
   * @returns {Promise<Array>} Array of user records with role metadata
   */
  async listUsers({ searchTerm, limit = 200 } = {}) {
    try {
      if (!(await isSupabaseAvailable())) {
        return [];
      }

      const client = await resolveSupabaseClient();
      if (!client) return [];

      // Fetch users and roles separately (no FK relationship exists)
      let usersQuery = client
        .from("cat_app_users")
        .select("user_name, created_at, updated_at")
        .order("user_name", { ascending: true });

      if (searchTerm) {
        usersQuery = usersQuery.ilike("user_name", `%${searchTerm}%`);
      }

      if (Number.isFinite(limit) && limit > 0) {
        usersQuery = usersQuery.limit(limit);
      }

      const { data: users, error: usersError } = await usersQuery;

      if (usersError) {
        console.error("Error fetching user list for admin:", usersError);
        return [];
      }

      if (!Array.isArray(users) || users.length === 0) {
        return [];
      }

      // Fetch roles for these users
      const userNames = users.map((u) => u.user_name);
      const { data: roles, error: rolesError } = await client
        .from("user_roles")
        .select("user_name, role")
        .in("user_name", userNames);

      if (rolesError) {
        console.error("Error fetching user roles:", rolesError);
        // Return users without roles rather than failing completely
        return users.map((u) => ({ ...u, user_roles: [] }));
      }

      // Create a map of user_name -> roles
      const roleMap = new Map();
      (roles || []).forEach((r) => {
        if (!roleMap.has(r.user_name)) {
          roleMap.set(r.user_name, []);
        }
        roleMap.get(r.user_name).push({ role: r.role });
      });

      // Merge users with their roles
      return users.map((u) => ({
        ...u,
        user_roles: roleMap.get(u.user_name) || [],
      }));
    } catch (error) {
      console.error("Unexpected error fetching user list for admin:", error);
      return [];
    }
  },
};

// ===== SITE SETTINGS API =====
export { siteSettingsAPI } from "./siteSettingsAPI.js";

// ===== CONVENIENCE EXPORTS =====

export const { getNamesWithDescriptions } = catNamesAPI;
export const { getNamesWithUserRatings } = catNamesAPI;
export const { getUserStats } = catNamesAPI;
