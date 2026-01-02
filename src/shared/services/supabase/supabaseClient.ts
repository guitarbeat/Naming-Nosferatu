/**
 * @module supabaseClient
 * @description Consolidated Supabase client with unified API for cat name tournament system.
 * Combines all database operations, real-time subscriptions, and utility functions.
 * Now modularized for better maintainability.
 */

export * from "./client";
export * from "./modules/admin";
export * from "./modules/catNames";
export * from "./modules/hiddenNames";
export * from "./modules/images";
export * from "./modules/settings";
export * from "./modules/tournaments";

import { catNamesAPI } from "./modules/catNames";

// ===== CONVENIENCE EXPORTS =====
// Maintain existing named exports used throughout the app
export const {
	getNamesWithDescriptions,
	getNamesWithUserRatings,
	getUserStats,
} = catNamesAPI;

// Re-export type if needed (already exported via * from ./client but being explicit)
export type { Database } from "./types";
