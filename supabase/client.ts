/**
 * @module supabaseClient
 * @description Facade URL for Supabase client.
 * Re-exports the base client implementation and all feature modules.
 * This structure prevents circular dependencies between the client and feature services.
 */

// Export the base client implementation
export * from "@/services/supabase/clientBase";

// Export all feature modules (which now import from clientBase)
export * from "@/services/supabase/modules/general";

// Re-export types
export type { Database } from "./types";
