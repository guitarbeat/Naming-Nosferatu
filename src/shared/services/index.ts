/**
 * @module shared/services
 * @description Consolidated service layer exports for external integrations and core APIs.
 * Provides a single entrypoint for all service-related imports.
 */

// Core application services
export { tournamentsAPI } from "@/services/tournament";
export * from "@/services/coreServices";

// Supabase integration services
export { imagesAPI, coreAPI, hiddenNamesAPI, siteSettingsAPI } from "@/services/supabase/api";
export { withSupabase } from "@/services/supabase/client";

// Offline/sync services
export { syncQueue } from "@/services/SyncQueue";

// Error handling
export { ErrorManager } from "@/services/errorManager";

// Authentication adapter
export { authAdapter } from "@/services/authAdapter";
