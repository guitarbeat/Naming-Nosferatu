/**
 * @file Tournament Hooks Index
 * @description Consolidated export point for all tournament-related hooks
 *
 * Primary hook (recommended):
 *   import { useTournamentManager } from './hooks'
 */

// Component hooks
export {
	default as useMagneticPull,
	useAudioManager,
	useKeyboardControls,
	useTournamentState,
	useTournamentVote,
} from "./tournamentComponentHooks";
export { useBracketTransformation } from "./useBracketTransformation";
export { useImageGallery } from "./useImageGallery";
export { useTournamentManager } from "./useTournamentManager";
export { useTournamentSelectionSaver } from "./useTournamentSelectionSaver";
export { useNameManagementCallbacks } from "./useTournamentSetupHooks";
export { useTournamentUIHandlers } from "./useTournamentUIHandlers";
export { useUndoWindow } from "./useUndoWindow";
