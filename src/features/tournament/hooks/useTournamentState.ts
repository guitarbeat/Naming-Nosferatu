/**
 * @module useTournamentState
 * @description Custom hook for managing tournament UI state and interactions.
 * Handles randomized names, selected options, transitions, and UI visibility states.
 */

import { useState, useEffect, useRef, useMemo } from "react";
import { useTournament } from "../../../core/hooks/useTournament";
import { shuffleArray } from "../../../shared/utils/coreUtils";
import { TOURNAMENT_TIMING } from "../../../core/constants";

/**
 * Custom hook for tournament state management
 * @param {Array} names - Array of names for the tournament
 * @param {Object} existingRatings - Existing ratings for names
 * @param {Function} onComplete - Callback when tournament completes
 * @param {Function} _onVote - Vote callback (unused but kept for API compatibility)
 * @returns {Object} Tournament state and handlers
 */
interface NameItem {
  id?: string | number;
  name?: string;
  [key: string]: unknown;
}

export function useTournamentState(
  names: NameItem[] | null | undefined,
  existingRatings: Record<string, number> | null | undefined,
  onComplete: (ratings: Record<string, number>) => void,
  _onVote: (winner: NameItem, loser: NameItem) => void,
) {
  const [randomizedNames, setRandomizedNames] = useState<NameItem[]>([]);
  const [selectedOption, setSelectedOption] = useState<"left" | "right" | "both" | "neither" | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastMatchResult, setLastMatchResult] = useState<string | null>(null);
  const [showMatchResult, setShowMatchResult] = useState<boolean>(false);
  const [showBracket, setShowBracket] = useState<boolean>(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState<boolean>(false);
  const [showRoundTransition, setShowRoundTransition] = useState<boolean>(false);
  const [nextRoundNumber, setNextRoundNumber] = useState<number | null>(null);
  const [votingError, setVotingError] = useState<unknown>(null);

  const tournamentStateRef = useRef({ isActive: false });

  // * Set up randomized names
  // Shuffle only when the identity set (ids) changes, not on shallow changes
  const namesIdentity = useMemo(
    () =>
      Array.isArray(names) ? names.map((n) => n.id || n.name).join(",") : "",
    [names],
  );
  useEffect(() => {
    if (Array.isArray(names) && names.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRandomizedNames((prev) => {
        const prevIds = Array.isArray(prev)
          ? prev.map((n) => n.id || n.name).join(",")
          : "";
        if (prevIds === namesIdentity) return prev; // no reshuffle
        return shuffleArray([...names]);
      });
    }
  }, [names, namesIdentity]);

  // * Tournament hook
  const tournament = useTournament({
    names: randomizedNames,
    existingRatings,
    onComplete,
  });

  // * Reset state on error
  useEffect(() => {
    if (tournament.isError) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedOption(null);

      setIsTransitioning(false);

      setIsProcessing(false);
      tournamentStateRef.current.isActive = false;
    }
  }, [tournament.isError]);

  // * Track tournament state
  useEffect(() => {
    if (tournament.currentMatch) {
      tournamentStateRef.current.isActive = true;
    }
  }, [tournament.currentMatch]);

  // * Round transition effect
  useEffect(() => {
    if (tournament.roundNumber > 1) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowRoundTransition(true);

      setNextRoundNumber(tournament.roundNumber);

      const timer = setTimeout(() => {
        setShowRoundTransition(false);
        setNextRoundNumber(null);
      }, TOURNAMENT_TIMING.ROUND_TRANSITION_DELAY);

      return () => clearTimeout(timer);
    }
  }, [tournament.roundNumber]);

  return {
    randomizedNames,
    selectedOption,
    setSelectedOption,
    isTransitioning,
    setIsTransitioning,
    isProcessing,
    setIsProcessing,
    lastMatchResult,
    setLastMatchResult,
    showMatchResult,
    setShowMatchResult,
    showBracket,
    setShowBracket,
    showKeyboardHelp,
    setShowKeyboardHelp,
    showRoundTransition,
    nextRoundNumber,
    votingError,
    setVotingError,
    tournament,
  };
}
