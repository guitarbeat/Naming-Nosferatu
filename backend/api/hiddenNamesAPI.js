/**
 * @module hiddenNamesAPI
 * @description Hidden Names Management API functions
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

export const hiddenNamesAPI = {
  /**
   * Hide a name for a user
   */
  async hideName(userName, nameId) {
    if (!isSupabaseAvailable() || !nameId || !userName) {
      throw new Error('Supabase not available or missing required parameters');
    }

    const { error } = await supabase
      .from('cat_name_ratings')
      .update({ is_hidden: true })
      .eq('user_name', userName)
      .eq('name_id', nameId);

    if (error) {
      throw new Error(`Failed to hide name: ${error.message}`);
    }

    return true;
  },

  /**
   * Unhide a name for a user
   */
  async unhideName(userName, nameId) {
    if (!isSupabaseAvailable() || !nameId || !userName) {
      throw new Error('Supabase not available or missing required parameters');
    }

    const { error } = await supabase
      .from('cat_name_ratings')
      .update({ is_hidden: false })
      .eq('user_name', userName)
      .eq('name_id', nameId);

    if (error) {
      throw new Error(`Failed to unhide name: ${error.message}`);
    }

    return true;
  }
};
