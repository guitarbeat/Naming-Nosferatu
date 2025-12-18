/**
 * @module supabaseAPI
 * @description Supabase API functions that depend on the client but don't create circular dependencies.
 * This file re-exports API functions from the backend client to avoid circular imports.
 */

// Re-export all API functions from the backend client
export {
  catNamesAPI,
  hiddenNamesAPI,
  tournamentsAPI,
  adminAPI,
  siteSettingsAPI,
  deleteName,
  getNamesWithDescriptions,
  getNamesWithUserRatings,
  getUserStats,
} from "./legacy/supabaseClient";

export { imagesAPI } from "./legacy/supabaseClient";
