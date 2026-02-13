/**
 * @module tournament/hooks
 * @description Centralized exports for all tournament-related hooks.
 * This consolidates hook imports across the tournament feature.
 */

// Consolidated helper hooks
export {
	useAudioManager,
	useProfileNotifications,
	useTournamentSelectionSaver,
	type UseAudioManagerResult,
} from "./useHelpers";

// Re-export from original files
export { useNameManagementView } from "./useNameManagementView";
export { useTournamentHandlers } from "./useTournamentHandlers";
export { useTournamentState } from "./useTournamentState";
