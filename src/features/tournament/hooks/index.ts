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

export { useTournamentController } from "./useTournamentController";
export { useTournamentSetupHooks } from "./useTournamentSetupHooks";
export { useTournamentUIHandlers } from "./useTournamentUIHandlers";
export { useBracketTransformation } from "./useBracketTransformation";
export { useImageGallery } from "./useImageGallery";
export { useUndoWindow } from "./useUndoWindow";
export { tournamentComponentHooks } from "./tournamentComponentHooks";
