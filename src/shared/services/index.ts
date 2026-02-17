/**
 * @module shared/services
 * @description Consolidated service layer exports for external integrations and core APIs.
 * Provides a single entrypoint for all service-related imports.
 */

// Authentication adapter
export { authAdapter } from "@/services/authAdapter";
export * from "@/services/coreServices";
// Error handling
export { ErrorManager } from "@/services/errorManager";
// Offline/sync services
export { syncQueue } from "@/services/SyncQueue";
// Supabase integration services
export { coreAPI, hiddenNamesAPI, imagesAPI, siteSettingsAPI } from "@/services/supabase/api";
export { withSupabase } from "@/services/supabase/client";
