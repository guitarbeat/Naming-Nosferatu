/**
 * @module Services Index
 * @description Barrel export for all services
 * Provides a single entry point for importing services
 */

// Error Management
export { ErrorManager } from "./errorManager";

// Sync Queue
export { syncQueue } from "./SyncQueue";

// Tournament Services
export {
	tournamentsAPI,
	EloRating,
	PreferenceSorter,
	CAT_IMAGES,
	getRandomCatImage,
	calculateBracketRound,
} from "./tournament";

// Supabase Services
export {
	queryClient,
	resolveSupabaseClient,
	supabase,
	updateSupabaseUserContext,
	isSupabaseAvailable,
	withSupabase,
	imagesAPI,
	coreAPI,
	hiddenNamesAPI,
	siteSettingsAPI,
} from "./supabase/supabase";
