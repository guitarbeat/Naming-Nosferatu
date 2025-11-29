/**
 * @module catNamesAPI
 * @description Cat Names Management API functions
 */

import { supabase } from "./supabaseClientIsolated.js";

/**
 * Check if Supabase is configured and available
 * @returns {boolean} True if Supabase is available
 */
const isSupabaseAvailable = () => {
  if (!supabase) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Supabase not configured. Some features may not work.");
    }
    return false;
  }
  return true;
};

export const catNamesAPI = {
  /**
   * Get all names with descriptions and ratings (hidden names are filtered out globally)
   * @param {boolean} includeHidden - If true, include hidden names (for admin views)
   */
  async getNamesWithDescriptions(includeHidden = false) {
    try {
      if (!isSupabaseAvailable()) {
        return [];
      }

      // Build query - optionally include hidden names for admin views
      let query = supabase
        .from("cat_name_options")
        .select("*")
        .order("name", { ascending: true });

      // Only filter out hidden names if not requesting them
      if (!includeHidden) {
        query = query.eq("is_hidden", false);
      }

      const { data: namesData, error: namesError } = await query;

      if (namesError) {
        console.error("Error fetching names from cat_name_options:", namesError);
        console.error("Error details:", {
          message: namesError.message,
          code: namesError.code,
          details: namesError.details,
        });
      }

      return namesData || [];
    } catch (error) {
      console.error("Error in getNamesWithDescriptions:", error);
      return [];
    }
  },

  /**
   * Get user statistics for a specific user
   */
  async getUserStats(userName) {
    try {
      if (!isSupabaseAvailable() || !userName) {
        return null;
      }

      const { data, error } = await supabase
        .from("cat_name_ratings")
        .select("*")
        .eq("user_name", userName);

      if (error) {
        console.error("Error fetching user stats:", error);
        return null;
      }

      if (!data || data.length === 0) {
        return {
          total_ratings: 0,
          total_wins: 0,
          total_losses: 0,
          win_rate: 0,
          avg_rating: 0,
          hidden_count: 0,
        };
      }

      const totalRatings = data.length;
      const wins = data.filter((r) => r.is_winner).length;
      const losses = data.filter((r) => !r.is_winner).length;
      const hiddenCount = data.filter((r) => r.is_hidden).length;
      const winRate = totalRatings > 0 ? (wins / totalRatings) * 100 : 0;
      const avgRating =
        data.reduce((sum, r) => sum + (r.rating || 0), 0) / totalRatings;

      return {
        total_ratings: totalRatings,
        total_wins: wins,
        total_losses: losses,
        win_rate: winRate,
        avg_rating: avgRating,
        hidden_count: hiddenCount,
      };
    } catch (error) {
      console.error("Error in getUserStats:", error);
      return null;
    }
  },
};
