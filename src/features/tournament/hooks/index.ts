/**
 * @file Tournament Hooks Index
 * @description Consolidated export point for all tournament-related hooks
 *
 * Usage:
 *   // Instead of:
 *   import { useTournamentController } from './hooks/useTournamentController'
 *   import { useTournamentUIHandlers } from './hooks/useTournamentUIHandlers'
 *
 *   // Use:
 *   import { useTournamentController, useTournamentUIHandlers } from './hooks'
 */

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
export { useTournamentController } from "./useTournamentController";
export { useTournamentSelectionSaver } from "./useTournamentSelectionSaver";
export { useTournamentUIHandlers } from "./useTournamentUIHandlers";
export { useUndoWindow } from "./useUndoWindow";
