/**
 * @module supabaseClient
 * @description Facade for Supabase client.
 * Re-exports the Supabase client implementation and types.
 */

// Export the Supabase client implementation
export * from "@/services/supabase/client";

// Re-export types
export type { Database } from "./types";
