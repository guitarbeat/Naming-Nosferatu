/**
 * @module tournamentsAPI
 * @description Tournament Management API functions
 */

import { supabase } from './supabaseClientIsolated.js';

/**
 * Check if Supabase is configured and available
 * @returns {boolean} True if Supabase is available
 */
const isSupabaseAvailable = () => {
  if (!supabase) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Supabase not configured. Some features may not work.');
    }
    return false;
  }
  return true;
};

export const tournamentsAPI = {
  /**
   * Get tournament history for a user
   */
  async getTournamentHistory(userName) {
    try {
      if (!isSupabaseAvailable() || !userName) {
        return [];
      }

      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('user_name', userName)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tournament history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTournamentHistory:', error);
      return [];
    }
  },

  /**
   * Save tournament name selections for a user
   */
  async saveTournamentSelections(userName, selectedNames, tournamentId = null) {
    try {
      if (!isSupabaseAvailable()) {
        return { success: false, error: 'Supabase not configured' };
      }

      const updatePromises = selectedNames.map(async (nameObj) => {
        try {
          const { error: rpcError } = await supabase.rpc(
            'increment_selection',
            {
              p_user_name: userName,
              p_name_id: nameObj.id
            }
          );

          if (rpcError) {
            console.error('RPC increment_selection error:', rpcError);
            return { error: rpcError };
          }

          return { error: null };
        } catch (error) {
          return { error };
        }
      });

      const results = await Promise.all(updatePromises);
      const errors = results.filter((result) => result.error);

      if (errors.length > 0) {
        console.warn('Some tournament selections had errors:', errors);
      }

      return {
        success: true,
        count: selectedNames.length,
        errors: errors.length
      };
    } catch (error) {
      console.error('Error in saveTournamentSelections:', error);
      return { success: false, error: error.message };
    }
  }
};
