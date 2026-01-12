/**
 * @file Tournament Hooks Index
 * @description Consolidated export point for all tournament-related hooks
 *
 * Primary hook (recommended):
 *   import { useTournamentManager } from './hooks'
 */

export { useTournamentManager } from "./useTournamentManager";

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
export { useNameManagementCallbacks } from "./useTournamentSetupHooks";
export { useTournamentSelectionSaver } from "./useTournamentSelectionSaver";
export { useTournamentUIHandlers } from "./useTournamentUIHandlers";
export { useUndoWindow } from "./useUndoWindow";
