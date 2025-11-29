/**
 * @module supabaseClient
 * @description Consolidated Supabase client with unified API for cat name tournament system.
 * Combines all database operations, real-time subscriptions, and utility functions.
 */

// * Import Supabase client directly to avoid TypeScript/JavaScript compatibility issues
import { createClient } from "@supabase/supabase-js";

// * Development mode check (browser-compatible)
const isDev =
  typeof process !== "undefined" && process.env?.NODE_ENV === "development";

// * Supabase configuration (isomorphic: works in browser and Node)
const readFromViteEnv = (key) => {
  try {
    // Vite replaces import.meta.env at build time in the browser
    // Guard access so Node does not error

    return typeof import.meta !== "undefined" && import.meta.env
      ? import.meta.env[key]
      : undefined;
  } catch {
    return undefined;
  }
};

// * Read from environment variables (prioritize env vars over hardcoded values)
// * Supports both VITE_ prefix (Vite) and direct SUPABASE_ prefix (Node/Vercel)
const SUPABASE_URL =
  readFromViteEnv("VITE_SUPABASE_URL") ||
  readFromViteEnv("SUPABASE_URL") ||
  (typeof process !== "undefined" && process.env?.SUPABASE_URL) ||
  "https://ocghxwwwuubgmwsxgyoy.supabase.co"; // Fallback for development

const SUPABASE_ANON_KEY =
  readFromViteEnv("VITE_SUPABASE_ANON_KEY") ||
  readFromViteEnv("SUPABASE_ANON_KEY") ||
  (typeof process !== "undefined" && process.env?.SUPABASE_ANON_KEY) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jZ2h4d3d3dXViZ213c3hneW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwOTgzMjksImV4cCI6MjA2NTY3NDMyOX0.93cpwT3YCC5GTwhlw4YAzSBgtxbp6fGkjcfqzdKX4E0"; // Fallback for development

let supabase = null;

const resolveSupabaseClient = async () => {
  // * Check for existing client instance from main client (prevents multiple GoTrueClient instances)
  if (typeof window !== "undefined" && window.__supabaseClient) {
    if (isDev) {
      console.log(
        "🔧 Backend: Reusing existing Supabase client from window.__supabaseClient",
      );
    }
    supabase = window.__supabaseClient;
    return supabase;
  }

  if (supabase) {
    return supabase;
  }

  if (isDev) {
    console.log("🔧 Backend: Resolving Supabase client...");
    console.log("   SUPABASE_URL:", SUPABASE_URL ? "SET" : "NOT SET");
    console.log("   SUPABASE_ANON_KEY:", SUPABASE_ANON_KEY ? "SET" : "NOT SET");
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    if (isDev) {
      console.warn(
        "Missing Supabase environment variables (SUPABASE_URL / SUPABASE_ANON_KEY). Supabase features are disabled.",
      );
    }
    return null;
  }

  try {
    if (isDev) {
      console.log("   Creating Supabase client...");
    }
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // * Store in window for reuse by other modules
    if (typeof window !== "undefined") {
      window.__supabaseClient = supabase;
    }

    if (isDev) {
      console.log("   ✅ Supabase client created successfully");
    }
    return supabase;
  } catch (error) {
    console.error("Failed to initialize Supabase client:", error);
    return null;
  }
};

export { supabase, resolveSupabaseClient };
export const getSupabaseServiceClient = resolveSupabaseClient;

// ===== HELPER FUNCTIONS =====

/**
 * Check if Supabase is configured and available
 * @returns {boolean} True if Supabase is available
 */
const isSupabaseAvailable = async () => {
  // * Check for existing client first (prevents creating new instances)
  if (typeof window !== "undefined" && window.__supabaseClient) {
    return true;
  }

  // * Check local cached client
  if (supabase) {
    return true;
  }

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
   * Get all names with descriptions and ratings (hidden names are filtered out globally)
   */
  async getNamesWithDescriptions() {
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
        is_hidden
      `,
        )
        .eq("is_active", true)
        .eq("is_hidden", false) // Filter out globally hidden names
        .order("avg_rating", { ascending: false });

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

      console.log("Names query result:", {
        totalNames: data?.length || 0,
        hiddenNames: hiddenCount || 0,
        hasActiveNames: data?.some((name) => name.is_active) || false,
      });

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

      const { error } = await supabase
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
  async getLeaderboard(limit = 50, categoryId = null, minTournaments = 3) {
    try {
      if (!(await isSupabaseAvailable())) {
        return [];
      }

      // Apply category filter if provided
      if (categoryId) {
        const { data: topNames, error: categoryError } = await supabase.rpc(
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

      // Query cat_name_options with avg_rating (which exists on that table)
      // cat_name_ratings has: name_id, user_name, rating, wins, losses, is_hidden, updated_at
      // cat_name_options has: id, name, description, avg_rating, is_active, is_hidden, category, etc.
      const { data, error } = await supabase
        .from("cat_name_options")
        .select("id, name, description, avg_rating, category")
        .eq("is_active", true)
        .eq("is_hidden", false)
        .gte("avg_rating", 1500) // Only names with meaningful ratings
        .order("avg_rating", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching leaderboard:", error);
        return [];
      }

      // Transform data to match expected format
      return (
        data?.map((row) => ({
          name_id: row.id,
          name: row.name,
          description: row.description,
          category: row.category,
          avg_rating: row.avg_rating || 1500,
          total_ratings: 0, // Not tracked per-name anymore
          wins: 0,
          losses: 0,
        })) || []
      );
    } catch (error) {
      if (isDev) {
        console.error("Error fetching leaderboard:", error);
      }
      return [];
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

      const { data, error } = await supabase.rpc("get_user_stats", {
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
   * Get all names with user-specific ratings and statistics
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
      const { data, error } = await supabase
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

      // Process data to include user-specific ratings
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
      const { data: ratingStats, error: ratingError } = await supabase
        .from("cat_name_ratings")
        .select("rating, is_hidden")
        .eq("user_name", userName);

      if (ratingError) {
        console.error("Error fetching user rating stats:", ratingError);
        return null;
      }

      // Get tournament selection statistics
      const { data: selectionStats, error: selectionError } = await supabase
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
      const { data, error } = await supabase
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
        return { success: true, processed: 0 };
      }

      const results = [];
      let processed = 0;

      for (const nameId of nameIds) {
        try {
          const result = await this.hideName(userName, nameId);
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
        console.error("Error hiding names:", error);
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
          const result = await this.unhideName(userName, nameId);
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
      const { data, error } = await supabase
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
      const { error: rpcError } = await supabase.rpc("create_user_account", {
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
   * This function is kept for backward compatibility but doesn't persist to the database.
   */
  async updateTournamentStatus(tournamentId, status) {
    try {
      if (!(await isSupabaseAvailable())) {
        return { success: false, error: "Supabase not configured" };
      }

      // Check if any selections exist for this tournament
      const { data: selections, error: fetchError } = await supabase
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
      // For now, we just return success to maintain backward compatibility.

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
      const { data, error } = await supabase
        .from("tournament_selections")
        .select("id, user_name, name_id, name, tournament_id, selected_at, selection_type, created_at")
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

      // Set user context for RLS policies
      const { error: contextError } = await supabase.rpc("set_user_context", {
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

      const { error: insertError } = await supabase
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

    // Check if name exists
    const { data: nameData, error: nameError } = await supabase
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
    const { data: nameWithHidden, error: hiddenError } = await supabase
      .from("cat_name_options")
      .select("is_hidden")
      .eq("id", nameId)
      .single();

    if (hiddenError) throw hiddenError;
    if (!nameWithHidden?.is_hidden) {
      throw new Error("Cannot delete name that is not hidden");
    }

    // Use transaction to delete
    const { error } = await supabase.rpc("delete_name_cascade", {
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

      const opts = {
        limit,
        search: undefined,
        sortBy: { column: "updated_at", order: "desc" },
      };
      const { data, error } = await supabase.storage
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
        const { data: urlData } = supabase.storage
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
    if (!(await isSupabaseAvailable())) {
      throw new Error("Supabase not configured");
    }

    const safe = (file?.name || "image").replace(/[^a-zA-Z0-9._-]/g, "_");
    // Store at bucket root to simplify listing (no recursion needed)
    const objectPath = `${prefix ? `${prefix}/` : ""}${Date.now()}-${safe}`;
    const { error } = await supabase.storage
      .from("cat-images")
      .upload(objectPath, file, {
        upsert: false,
      });
    if (error) throw error;
    const { data } = supabase.storage
      .from("cat-images")
      .getPublicUrl(objectPath);
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

      // Fetch users and roles separately (no FK relationship exists)
      let usersQuery = supabase
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
      const { data: roles, error: rolesError } = await supabase
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

// ===== LEGACY EXPORTS (for backward compatibility) =====

// Keep these for existing code that might still use them
export const { getNamesWithDescriptions } = catNamesAPI;
export const { getNamesWithUserRatings } = catNamesAPI;
export const { getUserStats } = catNamesAPI;
