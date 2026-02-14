/**
 * @module tournament/hooks
 * @description Centralized exports for all tournament-related hooks.
 * This consolidates hook imports across the tournament feature.
 */

// Consolidated helper hooks
export {
	type UseAudioManagerResult,
	useAudioManager,
	useProfileNotifications,
	useTournamentSelectionSaver,
} from "./useHelpers";
// Re-export from original files
export { useNameManagementView } from "./useNameManagementView";
// Consolidated tournament hooks
export {
	type UseTournamentStateResult,
	type UseTournamentVoteResult,
	useTournamentState,
	useTournamentVote,
} from "./useTournament";
export { useTournamentHandlers } from "./useTournamentHandlers";
