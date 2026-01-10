/**
 * @file Tournament Hooks Index
 * @description Consolidated export point for all tournament-related hooks
 *
 * Primary hook (recommended):
 *   import { useTournamentManager } from './hooks'
 *
 * Legacy hooks (deprecated - use useTournamentManager instead):
 *   import { useTournamentController } from './hooks/useTournamentController'
 *   import { useTournamentUIHandlers } from './hooks/useTournamentUIHandlers'
 */

export { useTournamentManager } from "./useTournamentManager";

// Legacy hooks - deprecated, use useTournamentManager instead
export {
	default as useMagneticPull,
	useAudioManager,
	useKeyboardControls,
	useTournamentState,
	useTournamentVote,
} from "./tournamentComponentHooks";
export { useBracketTransformation } from "./useBracketTransformation";
export { useImageGallery } from "./useImageGallery";
export { useNameManagementCallbacks } from "./useTournamentSetupHooks";
export { useTournamentController } from "./useTournamentController"; // @deprecated Use useTournamentManager
export { useTournamentSelectionSaver } from "./useTournamentSelectionSaver";
export { useTournamentUIHandlers } from "./useTournamentUIHandlers"; // @deprecated Use useTournamentManager
export { useUndoWindow } from "./useUndoWindow";
