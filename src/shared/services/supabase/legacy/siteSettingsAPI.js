/**
 * @module siteSettingsAPI
 * @description Site Settings Management API
 */

import { resolveSupabaseClient } from "../client";

const isDev = true; // Always log in prototype mode

const isSupabaseAvailable = async () => {
  const client = await resolveSupabaseClient();
  if (!client) {
    if (isDev) {
      console.warn("Supabase not configured. Some features may not work.");
    }
    return false;
  }
  return true;
};

export const siteSettingsAPI = {
  /**
   * Get cat's chosen name
   * @returns {Promise<Object|null>} Cat name object or null
   */
  async getCatChosenName() {
    const client = await resolveSupabaseClient();
    if (!client) {
      return null;
    }

    try {
      const { data, error } = await client
        .from("site_settings")
        .select("value")
        .eq("key", "cat_chosen_name")
        .maybeSingle();

      if (error) {
        console.error("Error fetching cat chosen name:", error);
        return null;
      }

      return data?.value || null;
    } catch (error) {
      console.error("Error in getCatChosenName:", error);
      return null;
    }
  },

  /**
   * Update cat's chosen name (admin only - enforced by RLS)
   * @param {Object} nameData - Name object with first_name, middle_names, last_name, etc.
   * @param {string} userName - Username making the update
   * @returns {Promise<Object>} Success/error response
   */
  async updateCatChosenName(nameData, userName) {
    const client = await resolveSupabaseClient();
    if (!client) {
      return { success: false, error: "Supabase not configured" };
    }

    try {
      // Validate required field
      if (!nameData.first_name || nameData.first_name.trim() === "") {
        return { success: false, error: "First name is required" };
      }

      // Parse middle names if provided as string
      let middleNames = nameData.middle_names || [];
      if (typeof middleNames === "string") {
        middleNames = middleNames
          .split(",")
          .map((n) => n.trim())
          .filter((n) => n);
      }

      // Build display name
      const nameParts = [
        nameData.first_name.trim(),
        ...middleNames,
        nameData.last_name ? nameData.last_name.trim() : "",
      ].filter(Boolean);

      const displayName = nameParts.join(" ");

      // Prepare value object
      const value = {
        first_name: nameData.first_name.trim(),
        middle_names: middleNames,
        last_name: nameData.last_name?.trim() || "",
        greeting_text: nameData.greeting_text || "Hello! My name is",
        display_name: displayName,
        is_set: true,
        show_banner: nameData.show_banner !== false,
      };

      // Update the setting (RLS will enforce admin-only)
      const { data, error } = await client
        .from("site_settings")
        .update({
          value,
          updated_by: userName,
        })
        .eq("key", "cat_chosen_name")
        .select()
        .single();

      if (error) {
        console.error("Error updating cat chosen name:", error);
        return {
          success: false,
          error: error.message || "Failed to update cat name",
        };
      }

      return { success: true, data: data.value };
    } catch (error) {
      console.error("Error in updateCatChosenName:", error);
      return {
        success: false,
        error: error.message || "Unknown error occurred",
      };
    }
  },
};
