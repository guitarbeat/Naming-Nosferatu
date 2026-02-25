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
} from "./useHelpers";

// Re-export from original files
export { useNameManagementView } from "./useNameManagementView";
export { useTournamentHandlers } from "./useTournamentHandlers";
// Export useTournamentState as useTournament for backward compatibility and convenience
export { useTournamentState as useTournament, useTournamentState } from "./useTournamentState";
export { useTournamentVote } from "./useTournamentVote";
