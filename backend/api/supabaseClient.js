/**
 * @module supabaseClient
 * @description Consolidated Supabase client with unified API for cat name tournament system.
 * Combines all database operations, real-time subscriptions, and utility functions.
 */

// * Import Supabase client directly to avoid TypeScript/JavaScript compatibility issues
import { createClient } from '@supabase/supabase-js';

// Development mode check (browser-compatible)
const isDev = true; // Always log in prototype mode

// * Supabase configuration (isomorphic: works in browser and Node)
const readFromViteEnv = (key) => {
  try {
    // Vite replaces import.meta.env at build time in the browser
    // Guard access so Node does not error
    // eslint-disable-next-line no-undef
    return typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env[key] : undefined;
  } catch {
    return undefined;
  }
};

// Hardcoded Supabase credentials for reliability in browser
const SUPABASE_URL = 'https://ocghxwwwuubgmwsxgyoy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jZ2h4d3d3dXViZ213c3hneW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwOTgzMjksImV4cCI6MjA2NTY3NDMyOX0.93cpwT3YCC5GTwhlw4YAzSBgtxbp6fGkjcfqzdKX4E0';

let supabase = null;

const resolveSupabaseClient = async () => {
  if (supabase) {
    return supabase;
  }

  console.log('🔧 Backend: Resolving Supabase client...');
  console.log('   SUPABASE_URL:', SUPABASE_URL ? 'SET' : 'NOT SET');
  console.log('   SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Missing Supabase environment variables (SUPABASE_URL / SUPABASE_ANON_KEY). Supabase features are disabled.');
    return null;
  }

  try {
    console.log('   Creating Supabase client...');
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('   ✅ Supabase client created successfully');
    return supabase;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
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
  const client = await resolveSupabaseClient();
  if (!client) {
    if (isDev) {
      console.warn('Supabase not configured. Some features may not work.');
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
      if (!(await isSupabaseAvailable())) {
        console.warn('Supabase not available, using fallback names');
        return [
          {
            id: 'aaron',
            name: 'aaron',
            description: 'temporary fallback — Supabase not configured',
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
            has_user_rating: false
          },
          {
            id: 'fix',
            name: 'fix',
            description: 'temporary fallback — Supabase not configured',
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
            has_user_rating: false
          },
          {
            id: 'the',
            name: 'the',
            description: 'temporary fallback — Supabase not configured',
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
            has_user_rating: false
          },
          {
            id: 'whiskers',
            name: 'whiskers',
            description: 'temporary fallback — Supabase not configured',
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
            has_user_rating: false
          },
          {
            id: 'shadow',
            name: 'shadow',
            description: 'temporary fallback — Supabase not configured',
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
            has_user_rating: false
          },
          {
            id: 'luna',
            name: 'luna',
            description: 'temporary fallback — Supabase not configured',
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
            has_user_rating: false
          },
          {
            id: 'felix',
            name: 'felix',
            description: 'temporary fallback — Supabase not configured',
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
            has_user_rating: false
          },
          {
            id: 'milo',
            name: 'milo',
            description: 'temporary fallback — Supabase not configured',
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
            has_user_rating: false
          }
        ];
      }

      // Get ALL hidden name IDs globally (not user-specific)
      let hiddenIds = [];
      const { data: hiddenData, error: hiddenError } = await supabase
        .from('cat_name_ratings')
        .select('name_id')
        .eq('is_hidden', true);

      if (hiddenError) {
        console.error('Error fetching hidden names:', hiddenError);
        hiddenIds = [];
      } else {
        hiddenIds = hiddenData?.map((item) => item.name_id) || [];
      }

      // Build query - leverages idx_cat_name_options_active partial index
      let query = supabase.from('cat_name_options').select(`
        id,
        name,
        description,
        created_at,
        avg_rating,
        popularity_score,
        total_tournaments,
        is_active
      `)
        .eq('is_active', true)  // Add this to use partial index
        .order('avg_rating', { ascending: false }); // Order uses index

      // Filter out ALL hidden names globally
      if (hiddenIds.length > 0) {
        query = query.not('id', 'in', `(${hiddenIds.join(',')})`);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching names with descriptions:', error);
        console.error('Query details:', {
          table: 'cat_name_options',
          filter: 'is_active = true',
          hiddenIds: hiddenIds.length,
          errorCode: error.code,
          errorMessage: error.message
        });
        return [];
      }

      console.log('Names query result:', {
        totalNames: data?.length || 0,
        hiddenNames: hiddenIds.length,
        hasActiveNames: data?.some(name => name.is_active) || false
      });

      // * If no active names found, return fallback names
      if (!data || data.length === 0) {
        console.warn('No active names found in database, using fallback names');
        return [
          {
            id: 'aaron',
            name: 'aaron',
            description: 'temporary fallback — no active names in database',
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
            has_user_rating: false
          },
          {
            id: 'fix',
            name: 'fix',
            description: 'temporary fallback — no active names in database',
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
            has_user_rating: false
          },
          {
            id: 'the',
            name: 'the',
            description: 'temporary fallback — no active names in database',
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
            has_user_rating: false
          },
          {
            id: 'whiskers',
            name: 'whiskers',
            description: 'temporary fallback — no active names in database',
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
            has_user_rating: false
          },
          {
            id: 'shadow',
            name: 'shadow',
            description: 'temporary fallback — no active names in database',
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
            has_user_rating: false
          },
          {
            id: 'luna',
            name: 'luna',
            description: 'temporary fallback — no active names in database',
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
            has_user_rating: false
          },
          {
            id: 'felix',
            name: 'felix',
            description: 'temporary fallback — no active names in database',
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
            has_user_rating: false
          },
          {
            id: 'milo',
            name: 'milo',
            description: 'temporary fallback — no active names in database',
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
            has_user_rating: false
          }
        ];
      }

      // Process data to include default values (no user-specific data in this view)
      return (
        (data || []).map((item) => ({
          ...item,
          updated_at: null,
          user_rating: null,
          user_wins: 0,
          user_losses: 0,
          isHidden: false,
          has_user_rating: false
        }))
      );
    } catch (error) {
      if (isDev) {
        console.error('Error fetching names:', error);
      }
      throw error;
    }
  },

  /**
   * Add a new name option
   */
  async addName(name, description = '') {
    try {
      if (!(await isSupabaseAvailable())) {
        return { success: false, error: 'Supabase not configured' };
      }

      const { data, error } = await supabase
        .from('cat_name_options')
        .insert([{ name: name.trim(), description: description.trim() }])
        .select()
        .single();

      if (error) {
        console.error('Error adding name:', error);
        return { success: false, error: error.message || 'Failed to add name' };
      }
      return { success: true, data };
    } catch (error) {
      if (isDev) {
        console.error('Error adding name:', error);
      }
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  },

  /**
   * Remove a name option
   */
  async removeName(name) {
    try {
      if (!(await isSupabaseAvailable())) {
        return { success: false, error: 'Supabase not configured' };
      }

      const { error } = await supabase
        .from('cat_name_options')
        .delete()
        .eq('name', name);

      if (error) {
        console.error('Error removing name:', error);
        return {
          success: false,
          error: error.message || 'Failed to remove name'
        };
      }
      return { success: true };
    } catch (error) {
      if (isDev) {
        console.error('Error removing name:', error);
      }
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  },

  /**
   * Get leaderboard data using materialized view for 5x performance improvement
   */
  async getLeaderboard(limit = 50, categoryId = null, minTournaments = 3) {
    try {
      if (!(await isSupabaseAvailable())) {
        return [];
      }

      // Use materialized view for 5x performance improvement
      let query = supabase
        .from('leaderboard_stats')
        .select('*')
        .gte('total_ratings', minTournaments);

      // Apply category filter if provided
      if (categoryId) {
        const { data: topNames, error: categoryError } = await supabase.rpc('get_top_names_by_category', {
          p_category: categoryId,
          p_limit: limit
        });

        if (categoryError) {
          console.error('Error fetching category leaderboard:', categoryError);
          return [];
        }
        return topNames || [];
      }

      const { data, error } = await query
        .order('avg_rating', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      if (isDev) {
        console.error('Error fetching leaderboard:', error);
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

      const { data, error } = await supabase.rpc('get_user_stats', {
        p_user_name: userName
      });

      if (error) {
        console.error('Error fetching user stats:', error);
        return null;
      }

      // Return first row (function returns single row)
      return data?.[0] || null;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return null;
    }
  },

  /**
   * Get all names with user-specific ratings and statistics
   */
  async getNamesWithUserRatings(userName) {
    try {
      if (!(await isSupabaseAvailable())) {
        console.warn('Supabase not available, using fallback names');
        return [
          {
            id: 'aaron',
            name: 'aaron',
            description: 'temporary fallback — Supabase not configured',
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
            has_user_rating: false
          }
        ];
      }

      // Get all names with user-specific ratings
      const { data, error } = await supabase
        .from('cat_name_options')
        .select(`
          id,
          name,
          description,
          created_at,
          avg_rating,
          popularity_score,
          total_tournaments,
          is_active,
          cat_name_ratings!left (
            user_name,
            rating,
            wins,
            losses,
            is_hidden,
            updated_at
          )
        `)
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching names with user ratings:', error);
        return [];
      }

      // Process data to include user-specific ratings
      return data?.map((item) => {
        // * Find user-specific rating data (including hidden status)
        const userRating = item.cat_name_ratings?.find(r => r.user_name === userName);

        // * Check if name is hidden for this user (even without a rating)
        const isHidden = userRating?.is_hidden === true;

        // * Debug logging for hidden names
        if (isDev && isHidden) {
          console.log(`🔍 Found hidden name: ${item.name} (${item.id}) for user: ${userName}`, {
            userRating,
            isHidden,
            allRatings: item.cat_name_ratings
          });
        }

        return {
          ...item,
          user_rating: userRating?.rating || null,
          user_wins: userRating?.wins || 0,
          user_losses: userRating?.losses || 0,
          isHidden: isHidden,
          updated_at: userRating?.updated_at || null,
          has_user_rating: !!userRating?.rating
        };
      }) || [];
    } catch (error) {
      if (isDev) {
        console.error('Error fetching names with user ratings:', error);
      }
      return [];
    }
  },

  /**
   * Get meaningful user statistics for profile page
   */
  async getUserStats(userName) {
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
          last_selection: null
        };
      }

      // Get user rating statistics
      const { data: ratingStats, error: ratingError } = await supabase
        .from('cat_name_ratings')
        .select('rating, is_hidden')
        .eq('user_name', userName);

      if (ratingError) {
        console.error('Error fetching user rating stats:', ratingError);
        return null;
      }

      // Get tournament selection statistics
      const { data: selectionStats, error: selectionError } = await supabase
        .from('tournament_selections')
        .select('name_id, tournament_id, selected_at, name')
        .eq('user_name', userName);

      if (selectionError) {
        console.error('Error fetching selection stats:', selectionError);
        return null;
      }

      // Calculate rating statistics
      const ratings = ratingStats || [];
      const activeRatings = ratings.filter(r => !r.is_hidden);
      const hiddenRatings = ratings.filter(r => r.is_hidden);
      const ratingValues = ratings.map(r => r.rating).filter(r => r != null);

      const avgRating = ratingValues.length > 0
        ? ratingValues.reduce((sum, r) => sum + r, 0) / ratingValues.length
        : 0;

      const minRating = ratingValues.length > 0 ? Math.min(...ratingValues) : 0;
      const maxRating = ratingValues.length > 0 ? Math.max(...ratingValues) : 0;
      const highRatings = ratingValues.filter(r => r >= 1500).length;
      const lowRatings = ratingValues.filter(r => r < 1000).length;

      // Calculate selection statistics
      const selections = selectionStats || [];
      const uniqueTournaments = new Set(selections.map(s => s.tournament_id)).size;
      const uniqueNames = new Set(selections.map(s => s.name_id)).size;

      // Find most selected name
      const nameCounts = {};
      selections.forEach(s => {
        nameCounts[s.name] = (nameCounts[s.name] || 0) + 1;
      });
      const mostSelected = Object.keys(nameCounts).length > 0
        ? Object.entries(nameCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0]
        : "None";

      const firstSelection = selections.length > 0
        ? Math.min(...selections.map(s => new Date(s.selected_at).getTime()))
        : null;
      const lastSelection = selections.length > 0
        ? Math.max(...selections.map(s => new Date(s.selected_at).getTime()))
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
        first_selection: firstSelection ? new Date(firstSelection).toISOString() : null,
        last_selection: lastSelection ? new Date(lastSelection).toISOString() : null
      };
    } catch (error) {
      if (isDev) {
        console.error('Error fetching user stats:', error);
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
      const { data, error } = await supabase
        .from('cat_name_options')
        .select(`
          id,
          name,
          description,
          created_at,
          avg_rating,
          popularity_score,
          total_tournaments,
          is_active,
          cat_name_ratings!inner (
            user_name,
            rating,
            wins,
            losses,
            updated_at
          )
        `)
        .eq('cat_name_ratings.user_name', 'aaron')
        .not('cat_name_ratings.rating', 'is', null)
        .order('cat_name_ratings.rating', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching Aaron\'s top names:', error);
        return [];
      }

      // Process data to include Aaron's specific ratings
      return data?.map((item) => ({
        ...item,
        user_rating: item.cat_name_ratings[0]?.rating || 0,
        user_wins: item.cat_name_ratings[0]?.wins || 0,
        user_losses: item.cat_name_ratings[0]?.losses || 0,
        updated_at: item.cat_name_ratings[0]?.updated_at || null,
        isHidden: false,
        has_user_rating: true
      })) || [];
    } catch (error) {
      if (isDev) {
        console.error('Error fetching Aaron\'s top names:', error);
      }
      return [];
    }
  }
};

/**
 * User Ratings Management
 */
export const ratingsAPI = {
  /**
   * Update user rating for a name
   */
  async updateRating(
    userName,
    nameId,
    newRating,
    outcome = null,
    context = 'tournament'
  ) {
    const now = new Date().toISOString();

    try {
      if (!(await isSupabaseAvailable())) {
        return { success: false, error: 'Supabase not configured' };
      }

      // Get existing rating data
      const { data: existingData, error: fetchError } = await supabase
        .from('cat_name_ratings')
        .select('rating, wins, losses, updated_at')
        .eq('user_name', userName)
        .eq('name_id', nameId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      // Calculate new values
      const currentRating = existingData?.rating || 1500;
      let wins = existingData?.wins || 0;
      let losses = existingData?.losses || 0;

      if (outcome === 'win') wins += 1;
      else if (outcome === 'loss') losses += 1;

      // Record to rating history
      await this.addRatingHistory(
        userName,
        nameId,
        currentRating,
        newRating,
        context
      );

      // Update rating
      const { error } = await supabase.from('cat_name_ratings').upsert(
        {
          user_name: userName,
          name_id: nameId,
          rating: newRating,
          wins,
          losses,
          updated_at: now
        },
        { onConflict: 'user_name,name_id', returning: 'minimal' }
      );

      if (error) {
        console.error('Error updating rating:', error);
        return {
          success: false,
          error: error.message || 'Failed to update rating'
        };
      }

      return {
        success: true,
        rating: newRating,
        previous_rating: currentRating,
        change: newRating - currentRating,
        wins,
        losses,
        updated_at: now
      };
    } catch (error) {
      if (isDev) {
        console.error('Error updating rating:', error);
      }
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  },

  /**
   * Get rating history for a user from the consolidated cat_name_ratings table
   */
  async getRatingHistory(userName, nameId = null, limit = 20) {
    try {
      if (!(await isSupabaseAvailable())) {
        return [];
      }

      let query = supabase
        .from('cat_name_ratings')
        .select('rating_history')
        .eq('user_name', userName)
        .not('rating_history', 'is', null);

      if (nameId) {
        query = query.eq('name_id', nameId);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching rating history:', error);
        return [];
      }

      // Extract and flatten rating history from JSONB
      const allHistory =
        data
          ?.map((item) => item.rating_history || [])
          .flat()
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, limit) || [];

      return allHistory;
    } catch (error) {
      if (isDev) {
        console.error('Error fetching rating history:', error);
      }
      return [];
    }
  },

  /**
   * Add rating history entry
   */
  async addRatingHistory(
    userName,
    nameId,
    oldRating,
    newRating,
    context = 'manual'
  ) {
    try {
      if (!(await isSupabaseAvailable())) {
        return { success: false, error: 'Supabase not configured' };
      }

      // Get name from name_id
      const { data: nameData } = await supabase
        .from('cat_name_options')
        .select('name')
        .eq('id', nameId)
        .single();

      // Get existing rating data to update the rating_history JSONB column
      const { data: existingRating, error: fetchError } = await supabase
        .from('cat_name_ratings')
        .select('rating_history')
        .eq('user_name', userName)
        .eq('name_id', nameId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      // Prepare new history entry
      const newHistoryEntry = {
        user_name: userName,
        name_id: nameId,
        name: nameData?.name || 'Unknown',
        old_rating: oldRating,
        new_rating: newRating,
        change: newRating - (oldRating || 0),
        context,
        timestamp: new Date().toISOString()
      };

      // Update or insert the rating_history in cat_name_ratings
      const { error } = await supabase.from('cat_name_ratings').upsert(
        {
          user_name: userName,
          name_id: nameId,
          rating_history: existingRating?.rating_history
            ? [...existingRating.rating_history, newHistoryEntry]
            : [newHistoryEntry]
        },
        {
          onConflict: 'user_name,name_id'
        }
      );

      if (error) throw error;
      return { success: true };
    } catch (error) {
      if (isDev) {
        console.error('Error saving rating history:', error);
      }
      throw error;
    }
  }
};

/**
 * Hidden Names Management
 */
const isPermissionError = (error) => {
  if (!error) return false;

  const status = error.status ?? error.statusCode;
  const code = typeof error.code === 'string' ? error.code.toUpperCase() : '';
  const message = error.message?.toLowerCase?.() ?? '';

  if (status === 401 || status === 403) return true;
  if (status === 400 && message.includes('row-level security')) return true;
  if (code === '42501' || code === 'PGRST301' || code === 'PGRST302' || code === 'PGRST303') {
    return true;
  }
  if (message.includes('only admins') || message.includes('permission')) {
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
        return { success: false, error: 'Supabase not configured' };
      }

      if (!nameId) {
        return { success: false, error: 'Name ID is required' };
      }

      const client = await resolveSupabaseClient();
      if (!client) {
        return { success: false, error: 'Supabase client unavailable' };
      }

      const { error } = await client.rpc('toggle_name_visibility', {
        p_name_id: nameId,
        p_hide: true
      });

      if (error) {
        if (isPermissionError(error)) {
          const permissionError = new Error('Only admins can hide names');
          permissionError.code = 'NOT_ADMIN';
          permissionError.originalError = error;
          throw permissionError;
        }
        throw error;
      }

      return { success: true, scope: 'global' };
    } catch (error) {
      if (isDev) {
        console.error('Error hiding name globally:', error);
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
        return { success: false, error: 'Supabase not configured' };
      }

      if (!nameId) {
        return { success: false, error: 'Name ID is required' };
      }

      const client = await resolveSupabaseClient();
      if (!client) {
        return { success: false, error: 'Supabase client unavailable' };
      }

      const { error } = await client.rpc('toggle_name_visibility', {
        p_name_id: nameId,
        p_hide: false
      });

      if (error) {
        if (isPermissionError(error)) {
          const permissionError = new Error('Only admins can unhide names');
          permissionError.code = 'NOT_ADMIN';
          permissionError.originalError = error;
          throw permissionError;
        }
        throw error;
      }

      return { success: true, scope: 'global' };
    } catch (error) {
      if (isDev) {
        console.error('Error unhiding name globally:', error);
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
        return { success: false, error: 'Supabase not configured' };
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
            scope: result.scope || null
          });
          if (result.success) processed++;
        } catch (error) {
          results.push({ nameId, success: false, error: error.message });
        }
      }

      return { success: true, processed, results };
    } catch (error) {
      if (isDev) {
        console.error('Error hiding names:', error);
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
        return { success: false, error: 'Supabase not configured' };
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
            scope: result.scope || null
          });
          if (result.success) processed++;
        } catch (error) {
          results.push({ nameId, success: false, error: error.message });
        }
      }

      return { success: true, processed, results };
    } catch (error) {
      if (isDev) {
        console.error('Error unhiding names:', error);
      }
      throw error;
    }
  },

  /**
   * Get hidden names for a user
   */
  async getHiddenNames(userName) {
    try {
      if (!(await isSupabaseAvailable())) {
        return [];
      }

      const { data, error } = await supabase
        .from('cat_name_ratings')
        .select(
          `
          name_id,
          updated_at,
          cat_name_options (
            id,
            name,
            description
          )
        `
        )
        .eq('user_name', userName)
        .eq('is_hidden', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      if (isDev) {
        console.error('Error fetching hidden names:', error);
      }
      return [];
    }
  }
};

/**
 * Tournament Management
 */
export const tournamentsAPI = {
  /**
   * Create a new tournament (updated for consolidated schema)
   */
  async createTournament(
    userName,
    tournamentName,
    participantNames,
    tournamentData = {}
  ) {
    try {
      if (!(await isSupabaseAvailable())) {
        return { success: false, error: 'Supabase not configured' };
      }

      // Create tournament in the consolidated cat_app_users table
      const newTournament = {
        id: crypto.randomUUID(), // Generate unique ID
        user_name: userName,
        tournament_name: tournamentName,
        participant_names: participantNames,
        tournament_data: tournamentData,
        status: 'in_progress',
        created_at: new Date().toISOString()
      };

      // Get or create user record in cat_app_users
      const { data: userData, error: userError } = await supabase
        .from('cat_app_users')
        .select('tournament_data')
        .eq('user_name', userName)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        // If it's a column doesn't exist error, initialize with empty array
        if (userError.code === '42703') {
          console.warn(
            'Tournament data column not found, initializing with empty array. Run the migration to add the column.'
          );
          const tournaments = [newTournament];

          // Try to create the column and insert the tournament
          const { error: upsertError } = await supabase
            .from('cat_app_users')
            .upsert(
              {
                user_name: userName,
                tournament_data: tournaments
              },
              {
                onConflict: 'user_name',
                ignoreDuplicates: false
              }
            )
            .select()
            .single();

          if (upsertError) {
            console.error(
              'Failed to create tournament after column creation attempt:',
              upsertError
            );
            // Return the tournament object anyway to prevent app crashes
            return newTournament;
          }
          return newTournament;
        }
        throw userError;
      }

      // Prepare tournament data array
      const tournaments = userData?.tournament_data || [];
      tournaments.push(newTournament);

      // Update user's tournament data
      const { error } = await supabase
        .from('cat_app_users')
        .upsert(
          {
            user_name: userName,
            tournament_data: tournaments
          },
          {
            onConflict: 'user_name',
            ignoreDuplicates: false
          }
        )
        .select()
        .single();

      if (error) {
        // If it's a column doesn't exist error, log warning and return tournament
        if (error.code === '42703') {
          console.warn(
            'Tournament data column not found, cannot save tournament. Run the migration to add the column.'
          );
          return newTournament;
        }
        throw error;
      }
      return newTournament;
    } catch (error) {
      if (isDev) {
        console.error('Error creating tournament:', error);
      }
      throw error;
    }
  },

  /**
   * Update tournament status
   */
  async updateTournamentStatus(tournamentId, status) {
    try {
      if (!(await isSupabaseAvailable())) {
        return { success: false, error: 'Supabase not configured' };
      }

      // Find the tournament in the user's tournament_data array
      // We need to search through all users to find the tournament
      const { data: allUsers, error: fetchError } = await supabase
        .from('cat_app_users')
        .select('user_name, tournament_data')
        .not('tournament_data', 'is', null);

      if (fetchError) {
        console.error(
          'Error fetching users for tournament update:',
          fetchError
        );
        return { success: false, error: 'Failed to fetch tournament data' };
      }

      let tournamentFound = false;
      let updatedUser = null;

      // Search through all users to find the tournament
      for (const user of allUsers) {
        if (!user.tournament_data || !Array.isArray(user.tournament_data))
          continue;

        const tournamentIndex = user.tournament_data.findIndex(
          (t) => t.id === tournamentId
        );
        if (tournamentIndex !== -1) {
          // Update the tournament status
          const updatedTournaments = [...user.tournament_data];
          updatedTournaments[tournamentIndex] = {
            ...updatedTournaments[tournamentIndex],
            status: status,
            updated_at: new Date().toISOString()
          };

          // Update the user's tournament data
          const { error: updateError } = await supabase
            .from('cat_app_users')
            .update({ tournament_data: updatedTournaments })
            .eq('user_name', user.user_name);

          if (updateError) {
            console.error('Error updating tournament status:', updateError);
            return {
              success: false,
              error: 'Failed to update tournament status'
            };
          }

          tournamentFound = true;
          updatedUser = user.user_name;
          break;
        }
      }

      if (!tournamentFound) {
        return { success: false, error: 'Tournament not found' };
      }

      return {
        success: true,
        tournamentId,
        status,
        updatedUser,
        message: `Tournament status updated to ${status}`
      };
    } catch (error) {
      if (isDev) {
        console.error('Error updating tournament status:', error);
      }
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  },

  /**
   * Get user tournaments (updated for consolidated schema)
   */
  async getUserTournaments(userName, status = null) {
    try {
      if (!(await isSupabaseAvailable())) {
        return [];
      }

      // Get tournaments from the consolidated cat_app_users table
      const { data: userData, error } = await supabase
        .from('cat_app_users')
        .select('tournament_data')
        .eq('user_name', userName)
        .single();

      if (error) {
        // If it's a column doesn't exist error, return empty array
        if (error.code === '42703') {
          console.warn(
            'Tournament data column not found, returning empty array. Run the migration to add the column.'
          );
          return [];
        }
        throw error;
      }

      let tournaments = userData?.tournament_data || [];

      // Filter by status if specified
      if (status) {
        tournaments = tournaments.filter((t) => t.status === status);
      }

      // Sort by created_at (newest first)
      tournaments.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
        const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
        
        // * Ensure valid dates before sorting
        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
          return 0; // * Treat invalid dates as equal
        }
        
        return dateB - dateA;
      });

      return tournaments;
    } catch (error) {
      if (isDev) {
        console.error('Error fetching tournaments:', error);
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
        return { success: false, error: 'Supabase not configured' };
      }

      const now = new Date().toISOString();
      const finalTournamentId = tournamentId || `tournament_${Date.now()}`;

      // Instead of using tournament_selections table (which has RLS issues),
      // we'll store the selections in the cat_name_ratings table
      // This approach is simpler and avoids RLS policy complications

      // Update the cat_name_ratings table to track selection count and tournament data
      const updatePromises = selectedNames.map(async (nameObj) => {
        try {
          // Use atomic server-side increment to avoid 409s and RLS reads
          const { error: rpcError } = await supabase.rpc(
            'increment_selection',
            {
              p_user_name: userName,
              p_name_id: nameObj.id
            }
          );

          if (rpcError) {
            console.error(
              'RPC increment_selection error for',
              userName,
              nameObj.id,
              ':',
              rpcError
            );
            return { error: rpcError };
          }

          return { error: null };
        } catch (error) {
          return { error };
        }
      });

      const results = await Promise.all(updatePromises);

      // Check for any errors
      const errors = results.filter((result) => result.error);
      if (errors.length > 0) {
        console.warn('Some tournament selections had errors:', errors);
      }

      // Also try to create a simple tournament record in the user's preferences
      try {
        const { data: userData } = await supabase
          .from('cat_app_users')
          .select('tournament_data')
          .eq('user_name', userName)
          .single();

        const tournaments = userData?.tournament_data || [];
        const newTournament = {
          id: finalTournamentId,
          name: `Tournament Setup - ${selectedNames.length} names`,
          created_at: now,
          status: 'setup_complete',
          selected_names: selectedNames.map((n) => ({
            id: n.id,
            name: n.name
          })),
          selection_count: selectedNames.length
        };

        tournaments.push(newTournament);

        const { error: userUpsertError } = await supabase
          .from('cat_app_users')
          .upsert(
            {
              user_name: userName,
              tournament_data: tournaments
            },
            { onConflict: 'user_name' }
          );

        if (userUpsertError) {
          console.error(
            'User upsert error for',
            userName,
            ':',
            userUpsertError
          );
        }
      } catch (tournamentError) {
        // Don't fail if tournament creation fails
        if (isDev) {
          console.warn('Could not save tournament record:', tournamentError);
        }
      }

      return {
        success: true,
        finalTournamentId,
        selectionCount: selectedNames.length,
        selectedNames: selectedNames.map((n) => n.name),
        method: 'cat_name_ratings_update'
      };
    } catch (error) {
      if (isDev) {
        console.error('Error saving tournament selections:', error);
      }
      throw error;
    }
  },

  /**
   * Create the tournament_selections table if it doesn't exist
   */
  async createTournamentSelectionsTable() {
    try {
      if (!(await isSupabaseAvailable())) {
        return { success: false, error: 'Supabase not configured' };
      }

      const { error } = await supabase.rpc(
        'create_tournament_selections_table'
      );
      if (error) {
        if (isDev) {
          console.warn(
            'Could not create table via RPC, table may already exist:',
            error
          );
        }
      }
    } catch (error) {
      if (isDev) {
        console.warn(
          'Table creation RPC not available, table may already exist:',
          error
        );
      }
    }
  },

  /**
   * Get tournament selection history for a user
   * @param {string} userName - The username
   * @param {number} limit - Maximum number of records to return
   * @returns {Array} Array of tournament selection records
   */
  async getTournamentSelectionHistory(userName, limit = 50) {
    try {
      if (!(await isSupabaseAvailable())) {
        return [];
      }

      const { data, error } = await supabase
        .from('tournament_selections')
        .select(
          `
          *,
          cat_name_options (
            name,
            description
          )
        `
        )
        .eq('user_name', userName)
        .order('selected_at', { ascending: false })
        .limit(limit);

      if (error) {
        // If table doesn't exist, return empty array
        if (error.code === '42P01') {
          return [];
        }
        throw error;
      }

      return data || [];
    } catch (error) {
      if (isDev) {
        console.error('Error fetching tournament selection history:', error);
      }
      return [];
    }
  },

  /**
   * Get popular names based on tournament selections
   * @param {number} limit - Maximum number of names to return
   * @returns {Array} Array of popular names with selection counts
   */
  async getPopularTournamentNames(limit = 20) {
    try {
      if (!(await isSupabaseAvailable())) {
        return [];
      }

      const { data, error } = await supabase
        .from('tournament_selections')
        .select(
          `
          name_id,
          cat_name_options (
            name,
            description
          ),
          selection_count:count
        `
        )
        .group('name_id, cat_name_options.name, cat_name_options.description')
        .order('selection_count', { ascending: false })
        .limit(limit);

      if (error) {
        // If table doesn't exist, return empty array
        if (error.code === '42P01') {
          return [];
        }
        throw error;
      }

      return data || [];
    } catch (error) {
      if (isDev) {
        console.error('Error fetching popular tournament names:', error);
      }
      return [];
    }
  },

  /**
   * Get personalized name recommendations for a user
   * @param {string} userName - The username
   * @param {number} limit - Maximum number of recommendations to return
   * @returns {Array} Array of recommended names with scores and reasoning
   */
  async getPersonalizedRecommendations(userName, limit = 10) {
    try {
      if (!(await isSupabaseAvailable())) {
        return [];
      }

      const { data, error } = await supabase.rpc(
        'get_personalized_recommendations',
        {
          p_user_name: userName,
          p_limit: limit
        }
      );

      if (error) {
        console.error('Error getting personalized recommendations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      if (isDev) {
        console.error('Error getting personalized recommendations:', error);
      }
      return [];
    }
  },

  /**
   * Get selection analytics dashboard data
   * @returns {Object} Dashboard statistics and metrics
   */
  async getSelectionDashboard() {
    try {
      if (!(await isSupabaseAvailable())) {
        return null;
      }

      const { data, error } = await supabase
        .from('selection_summary')
        .select('*')
        .single();

      if (error) {
        console.error('Error getting selection dashboard:', error);
        return null;
      }

      return data;
    } catch (error) {
      if (isDev) {
        console.error('Error getting selection dashboard:', error);
      }
      return null;
    }
  },

  /**
   * Get popular names based on selections
   * @param {number} limit - Maximum number of names to return
   * @returns {Array} Array of popular names with selection metrics
   */
  async getPopularNamesBySelections(limit = 20) {
    try {
      if (!(await isSupabaseAvailable())) {
        return [];
      }

      const { data, error } = await supabase
        .from('popular_names_by_selections')
        .select('*')
        .limit(limit);

      if (error) {
        console.error('Error getting popular names:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      if (isDev) {
        console.error('Error getting popular names:', error);
      }
      return [];
    }
  }
};

/**
 * User Preferences Management
 */
export const userPreferencesAPI = {
  /**
   * Get user preferences (updated for consolidated schema)
   */
  async getPreferences(userName) {
    try {
      if (!(await isSupabaseAvailable())) {
        return {
          user_name: userName,
          preferred_categories: [],
          tournament_size_preference: 8,
          rating_display_preference: 'elo',
          sound_enabled: true,
          theme_preference: 'dark'
        };
      }

      // First try to get preferences from the preferences column
      const { data, error } = await supabase
        .from('cat_app_users')
        .select('preferences')
        .eq('user_name', userName)
        .single();

      if (error && error.code !== 'PGRST116') {
        // If it's a column doesn't exist error, return defaults
        if (error.code === '42703') {
          console.warn(
            'Preferences column not found, returning defaults. Run the migration to add the column.'
          );
          return {
            user_name: userName,
            preferred_categories: [],
            tournament_size_preference: 8,
            rating_display_preference: 'elo',
            sound_enabled: true,
            theme_preference: 'dark'
          };
        }
        throw error;
      }

      // Return preferences if they exist, otherwise return defaults
      return (
        data?.preferences || {
          user_name: userName,
          preferred_categories: [],
          tournament_size_preference: 8,
          rating_display_preference: 'elo',
          sound_enabled: true,
          theme_preference: 'dark'
        }
      );
    } catch (error) {
      if (isDev) {
        console.error('Error fetching preferences:', error);
      }
      // Return defaults on any error to prevent app crashes
      return {
        user_name: userName,
        preferred_categories: [],
        tournament_size_preference: 8,
        rating_display_preference: 'elo',
        sound_enabled: true,
        theme_preference: 'dark'
      };
    }
  },

  /**
   * Update user preferences (updated for consolidated schema)
   */
  async updatePreferences(userName, preferences) {
    try {
      if (!(await isSupabaseAvailable())) {
        return preferences;
      }

      // Update preferences in the consolidated cat_app_users table
      const { data, error } = await supabase
        .from('cat_app_users')
        .upsert(
          {
            user_name: userName,
            preferences: {
              ...preferences,
              updated_at: new Date().toISOString()
            }
          },
          { onConflict: 'user_name' }
        )
        .select()
        .single();

      if (error) {
        // If it's a column doesn't exist error, log warning and return preferences
        if (error.code === '42703') {
          console.warn(
            'Preferences column not found, cannot save preferences. Run the migration to add the column.'
          );
          return preferences;
        }
        throw error;
      }
      return data?.preferences;
    } catch (error) {
      if (isDev) {
        console.error('Error updating preferences:', error);
      }
      // Return the preferences object on error to prevent app crashes
      return preferences;
    }
  }
};

/**
 * Categories Management
 */
export const categoriesAPI = {
  /**
   * Get all categories
   */
  async getCategories() {
    try {
      if (!(await isSupabaseAvailable())) {
        return [];
      }

      // Get categories from the consolidated cat_name_options table
      const { data, error } = await supabase
        .from('cat_name_options')
        .select('categories')
        .not('categories', 'is', null);

      if (error) throw error;
      return data || [];
    } catch (error) {
      if (isDev) {
        console.error('Error fetching categories:', error);
      }
      return [];
    }
  },

  /**
   * Get names by category using optimized function with partial index
   */
  async getNamesByCategory(categoryId, limit = 100) {
    try {
      if (!(await isSupabaseAvailable())) {
        return [];
      }

      // Use optimized function with partial index
      const { data, error } = await supabase.rpc('get_top_names_by_category', {
        p_category: categoryId,
        p_limit: limit
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      if (isDev) {
        console.error('Error fetching names by category:', error);
      }
      return [];
    }
  }
};

// ===== UTILITY FUNCTIONS =====

/**
 * Note: Rating history is now stored in cat_name_ratings.rating_history as JSONB
 * This function is kept for backward compatibility but no longer creates tables
 */
export const ensureRatingHistoryTable = async () => {
  console.log(
    'Rating history is now stored in cat_name_ratings.rating_history as JSONB'
  );
  return { success: true };
};

/**
 * Delete a name with cascade (only if hidden)
 */
export const deleteName = async (nameId) => {
  try {
    if (!(await isSupabaseAvailable())) {
      return { success: false, error: 'Supabase not configured' };
    }

    // Check if name exists
    const { data: nameData, error: nameError } = await supabase
      .from('cat_name_options')
      .select('name')
      .eq('id', nameId)
      .single();

    if (nameError?.code === 'PGRST116') {
      throw new Error('Name has already been deleted');
    } else if (nameError) {
      throw nameError;
    }

    if (!nameData) {
      throw new Error('Name does not exist in database');
    }

    // Check if name is hidden
    const { data: hiddenData, error: hiddenError } = await supabase
      .from('cat_name_ratings')
      .select('*')
      .eq('name_id', nameId)
      .eq('is_hidden', true);

    if (hiddenError) throw hiddenError;
    if (!hiddenData || hiddenData.length === 0) {
      throw new Error('Cannot delete name that is not hidden');
    }

    // Use transaction to delete
    const { error } = await supabase.rpc('delete_name_cascade', {
      target_name_id: nameId
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    if (isDev) {
      console.error('Error in deleteName function:', error);
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
  async list(prefix = '', limit = 1000) {
    try {
      if (!(await isSupabaseAvailable())) {
        return [];
      }

      const opts = { limit, search: undefined, sortBy: { column: 'updated_at', order: 'desc' } };
      const { data, error } = await supabase.storage.from('cat-images').list(prefix, opts);
      if (error) {
        if (isDev) console.warn('imagesAPI.list error:', error);
        return [];
      }
      const files = (data || []).filter((f) => f && f.name);
      if (!files.length) return [];

      const rankByExt = (name) => {
        const n = name.toLowerCase();
        if (n.endsWith('.avif')) return 1;
        if (n.endsWith('.webp')) return 2;
        if (n.endsWith('.jpg') || n.endsWith('.jpeg')) return 3;
        if (n.endsWith('.png')) return 4;
        if (n.endsWith('.gif')) return 5;
        return 9;
      };

      const pickSmaller = (a, b) => {
        const sizeA = a?.metadata?.size ?? a?.size;
        const sizeB = b?.metadata?.size ?? b?.size;
        if (typeof sizeA === 'number' && typeof sizeB === 'number') {
          return sizeA <= sizeB ? a : b;
        }
        // fallback to extension ranking
        return rankByExt(a.name) <= rankByExt(b.name) ? a : b;
      };

      const byBase = new Map();
      for (const f of files) {
        const base = f.name.replace(/\.[^.]+$/, '').toLowerCase();
        const current = byBase.get(base);
        byBase.set(base, current ? pickSmaller(current, f) : f);
      }

      // Map to public URLs
      const toUrl = (name) => {
        const fullPath = prefix ? `${prefix}/${name}` : name;
        const { data: urlData } = supabase.storage.from('cat-images').getPublicUrl(fullPath);
        return urlData?.publicUrl;
      };

      return Array.from(byBase.values())
        .map((f) => toUrl(f.name))
        .filter(Boolean);
    } catch (e) {
      if (isDev) console.error('imagesAPI.list fatal:', e);
      return [];
    }
  },

  /**
   * Upload an image file to the `cat-images` bucket. Returns public URL.
   */
  async upload(file, _userName = 'anon', prefix = '') {
    if (!(await isSupabaseAvailable())) {
      throw new Error('Supabase not configured');
    }

    const safe = (file?.name || 'image').replace(/[^a-zA-Z0-9._-]/g, '_');
    // Store at bucket root to simplify listing (no recursion needed)
    const objectPath = `${prefix ? `${prefix}/` : ''}${Date.now()}-${safe}`;
    const { error } = await supabase.storage.from('cat-images').upload(objectPath, file, {
      upsert: false
    });
    if (error) throw error;
    const { data } = supabase.storage.from('cat-images').getPublicUrl(objectPath);
    return data?.publicUrl;
  }
};
// ===== ADMIN UTILITIES =====

/**
 * Admin utilities
 */
export const adminAPI = {
  /**
   * Refresh materialized views for updated statistics
   */
  async refreshMaterializedViews() {
    try {
      if (!(await isSupabaseAvailable())) {
        return { success: false, error: 'Supabase not available' };
      }

      const { data, error } = await supabase.rpc('refresh_materialized_views');

      if (error) {
        console.error('Error refreshing views:', error);
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      console.error('Error refreshing views:', error);
      return { success: false, error };
    }
  },
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

      let query = supabase
        .from('cat_app_users')
        .select('user_name, user_role, created_at, updated_at')
        .order('user_name', { ascending: true });

      if (searchTerm) {
        query = query.ilike('user_name', `%${searchTerm}%`);
      }

      if (Number.isFinite(limit) && limit > 0) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching user list for admin:', error);
        return [];
      }

      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Unexpected error fetching user list for admin:', error);
      return [];
    }
  }
};

// ===== SITE SETTINGS API =====
export { siteSettingsAPI } from './siteSettingsAPI.js';

// ===== LEGACY EXPORTS (for backward compatibility) =====

// Keep these for existing code that might still use them
export const getNamesWithDescriptions = catNamesAPI.getNamesWithDescriptions;
export const getNamesWithUserRatings = catNamesAPI.getNamesWithUserRatings;
export const getUserStats = catNamesAPI.getUserStats;
export const addRatingHistory = ratingsAPI.addRatingHistory;
export const updateRating = ratingsAPI.updateRating;
export const getRatingHistory = ratingsAPI.getRatingHistory;
