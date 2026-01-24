/**
 * @module supabaseClient
 * @description Consolidated Supabase client with unified API for cat name tournament system.
 * Combines all database operations, real-time subscriptions, and utility functions.
 */

// Re-export types
export type { Database } from "@supabase/types";
// Re-export base client functionality
export * from "./clientBase";
// Re-export modules
export * from "./modules/general";
