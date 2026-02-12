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
export { useTournament } from "./useTournament";
export { useTournamentHandlers } from "./useTournamentHandlers";
export { useTournamentState } from "./useTournamentState";
export { useTournamentVote } from "./useTournamentVote";
