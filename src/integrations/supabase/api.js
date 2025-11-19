/**
 * @module supabaseAPI
 * @description Supabase API functions that depend on the client but don't create circular dependencies.
 * This file re-exports API functions from the backend client to avoid circular imports.
 */

// Re-export all API functions from the backend client
export {
  catNamesAPI,
  ratingsAPI,
  hiddenNamesAPI,
  tournamentsAPI,
  userPreferencesAPI,
  categoriesAPI,
  adminAPI,
  siteSettingsAPI,
  deleteName,
  getNamesWithDescriptions,
  getNamesWithUserRatings,
  getUserStats,
  addRatingHistory,
  updateRating,
  getRatingHistory,
  ensureRatingHistoryTable,
} from "../../../backend/api/supabaseClient";

// * Import imagesAPI separately to avoid circular dependency
export { imagesAPI } from "../../../backend/api/supabaseClient";
