/**
 * @module tournament/hooks
 * @description Centralized exports for all tournament-related hooks.
 */

export { useAudioManager } from "./useHelpers";
export { useTournamentSelectionSaver } from "./useTournamentSelectionSaver";
export { useNameManagementView } from "./useNameManagementView";
export { useTournamentHandlers } from "./useTournamentHandlers";
// Export useTournamentState as useTournament for backward compatibility and convenience
export { useTournamentState as useTournament, useTournamentState } from "./useTournamentState";
export { useTournamentVote } from "./useTournamentVote";
export { useTournamentState, useTournamentState as useTournament } from "./useTournamentState";
export { useTournamentHandlers } from "./useTournamentHandlers";
