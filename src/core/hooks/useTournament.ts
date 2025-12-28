import { useMemo } from "react";
import EloRating from "../../features/tournament/EloRating";
import useAppStore from "../store/useAppStore";
import { useTournamentState } from "./tournament/useTournamentState";
import { useTournamentPersistence } from "./tournament/useTournamentPersistence";
import { useTournamentVoting } from "./tournament/useTournamentVoting";
import { useTournamentProgress } from "./tournament/useTournamentProgress";
import { NameItem } from "../../shared/propTypes";

/**
 * Custom hook for managing tournament state and logic
 * Composes smaller, focused hooks for better maintainability
 * @param {Object} params - Tournament parameters
 * @param {Array} params.names - Array of names to compete in tournament
 * @param {Object} params.existingRatings - Existing ratings for names
 * @param {Function} params.onComplete - Callback when tournament completes
 * @returns {Object} Tournament state and handlers
 */
export function useTournament({
  names = [],
  existingRatings = {},
  onComplete,
}: {
  names?: NameItem[];
  existingRatings?: Record<
    string,
    { rating: number; wins?: number; losses?: number }
  >;
  onComplete?: (
    results: Array<{
      name: string;
      id: string;
      rating: number;
      wins: number;
      losses: number;
    }>,
  ) => void;
} = {}) {
  // Single Elo instance
  const elo = useMemo(() => new EloRating(), []);
  const userName = useAppStore((state) => state.user.name);

  // * Get tournament state from store
  const tournament = useAppStore((state) => state.tournament);
  const { ratings: currentRatings } = tournament;

  // * Get tournament actions from store
  const { tournamentActions } = useAppStore();

  // * Persistent storage
  const {
    persistentState,
    updatePersistentState,
    roundNumber,
    currentMatchNumber,
    totalMatches,
    canUndo,
  } = useTournamentPersistence({ names, userName });

  // * Tournament state management
  const { tournamentState, updateTournamentState } = useTournamentState({
    names,
    existingRatings,
    updatePersistentState,
  });

  const { currentMatch, isTransitioning, sorter, isError } = tournamentState;

  // * Voting logic
  const { handleVote, getCurrentRatings } = useTournamentVoting({
    names,
    userName,
    currentMatch,
    currentMatchNumber,
    roundNumber,
    totalMatches,
    currentRatings,
    sorter,
    persistentState,
    updatePersistentState,
    updateTournamentState,
    onComplete,
    isTransitioning,
    isError,
    elo,
    tournamentActions,
  });

  // * Progress and undo logic
  const { handleUndo, progress } = useTournamentProgress({
    namesLength: names.length,
    isTransitioning,
    canUndo,
    sorter,
    currentMatchNumber,
    roundNumber,
    totalMatches,
    persistentState,
    updatePersistentState,
    updateTournamentState,
  });

  // * Return error state if there's an error
  if (isError) {
    return {
      currentMatch: null,
      handleVote: () => {},
      progress: 0,
      roundNumber: 0,
      currentMatchNumber: 0,
      totalMatches: 0,
      matchHistory: [],
      getCurrentRatings: () => [],
      isError: true,
      userName: persistentState.userName,
    };
  }

  // * Return tournament state and handlers
  return {
    currentMatch,
    isTransitioning,
    roundNumber,
    currentMatchNumber,
    totalMatches,
    progress,
    handleVote,
    handleUndo,
    canUndo,
    getCurrentRatings,
    isError,
    matchHistory: persistentState.matchHistory,
    userName: persistentState.userName,
  };
}
