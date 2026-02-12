/**
 * @module Services Index
 * @description Barrel export for all services
 * Provides a single entry point for importing services
 */

// Error Management
export { ErrorManager } from "./errorManager";

// Sync Queue
export { syncQueue } from "./SyncQueue";
// Supabase Services
export {
	coreAPI,
	hiddenNamesAPI,
	imagesAPI,
	isSupabaseAvailable,
	queryClient,
	resolveSupabaseClient,
	siteSettingsAPI,
	supabase,
	updateSupabaseUserContext,
	withSupabase,
} from "./supabase-client/client";
// Tournament Services
export {
	CAT_IMAGES,
	calculateBracketRound,
	EloRating,
	getRandomCatImage,
	PreferenceSorter,
	tournamentsAPI,
} from "./tournament";
