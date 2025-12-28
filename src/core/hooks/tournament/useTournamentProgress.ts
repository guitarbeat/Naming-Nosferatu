import { useCallback, useMemo } from "react";
import { calculateBracketRound } from "../../../shared/utils/coreUtils";

import { NameItem, MatchRecord, PersistentState, TournamentState } from "../../../shared/propTypes";

interface UseTournamentProgressProps {
  namesLength: number;
  isTransitioning: boolean;
  canUndo: boolean;
  sorter: unknown;
  currentMatchNumber: number;
  roundNumber: number;
  totalMatches: number;
  persistentState: PersistentState;
  updatePersistentState: (
    state:
      | Partial<PersistentState>
      | ((prev: PersistentState) => Partial<PersistentState>),
  ) => void;
  updateTournamentState: (
    state:
      | Partial<TournamentState>
      | ((prev: TournamentState) => Partial<TournamentState>),
  ) => void;
}

export function useTournamentProgress({
  namesLength,
  isTransitioning,
  canUndo,
  sorter,
  currentMatchNumber,
  roundNumber,
  totalMatches,
  persistentState,
  updatePersistentState,
  updateTournamentState,
}: UseTournamentProgressProps) {
  const handleUndo = useCallback(() => {
    if (
      isTransitioning ||
      !canUndo ||
      persistentState.matchHistory.length === 0
    ) {
      return;
    }

    updateTournamentState({ isTransitioning: true });

    const lastVote = persistentState.matchHistory[
      persistentState.matchHistory.length - 1
    ] as MatchRecord;

    if (!lastVote || !lastVote.match) {
      updateTournamentState({ isTransitioning: false });
      return;
    }

    updateTournamentState({
      currentMatch: lastVote.match,
      currentMatchNumber: lastVote.matchNumber || 1,
    });

    updatePersistentState({
      matchHistory: persistentState.matchHistory.slice(0, -1),
    });

    const sorterAny = sorter as Record<string, unknown>;
    if (sorter && typeof sorterAny.undoLastPreference === "function") {
      (sorterAny.undoLastPreference as () => void)();
    } else if (
      sorter &&
      sorterAny.preferences instanceof Map &&
      (lastVote?.match?.left as NameItem)?.name &&
      (lastVote?.match?.right as NameItem)?.name
    ) {
      // * Use optional chaining for safety (already validated above, but defensive)
      const leftName =
        (lastVote.match.left as NameItem)?.name || (lastVote.match.left as string);
      const rightName =
        (lastVote.match.right as NameItem)?.name ||
        (lastVote.match.right as string);
      if (!leftName || !rightName) {
        updateTournamentState({ isTransitioning: false });
        return;
      }
      const key = `${leftName}-${rightName}`;
      const reverseKey = `${rightName}-${leftName}`;
      (sorterAny.preferences as Map<string, unknown>).delete(key);
      (sorterAny.preferences as Map<string, unknown>).delete(reverseKey);
      if (typeof sorterAny._pairIndex === "number") {
        const newSorter = { ...sorterAny };
        newSorter._pairIndex = Math.max(
          0,
          (sorterAny._pairIndex as number) - 1,
        );
        updateTournamentState({ sorter: newSorter });
      }
    }

    // * Calculate round based on bracket structure for undo
    // * Need to recalculate which round the previous match was in
    // * After undo, we're back to the match before the one we undid
    if (namesLength >= 2 && persistentState.matchHistory.length > 0) {
      // * Get the match number of the last remaining vote (after undo)
      const remainingHistory = persistentState.matchHistory.slice(0, -1);
      const previousMatchNumber =
        remainingHistory.length > 0
          ? remainingHistory[remainingHistory.length - 1]?.matchNumber ||
            currentMatchNumber
          : currentMatchNumber;

      // * Use shared utility function for round calculation
      const calculatedRound = calculateBracketRound(
        namesLength,
        previousMatchNumber,
      );

      if (calculatedRound !== roundNumber) {
        updateTournamentState({ roundNumber: calculatedRound });
        updatePersistentState({ currentRound: calculatedRound });
      }
    } else if (persistentState.matchHistory.length === 0) {
      // * If no history left, we're back to round 1
      updateTournamentState({ roundNumber: 1 });
      updatePersistentState({ currentRound: 1 });
    }

    updateTournamentState({
      canUndo: persistentState.matchHistory.length > 0,
    });

    setTimeout(() => {
      updateTournamentState({ isTransitioning: false });
    }, 500);
  }, [
    isTransitioning,
    canUndo,
    persistentState.matchHistory,
    sorter,
    currentMatchNumber,
    namesLength,
    roundNumber,
    updateTournamentState,
    updatePersistentState,
  ]);

  const progress = useMemo(() => {
    if (!totalMatches) {
      return 0;
    }
    return Math.round((currentMatchNumber / totalMatches) * 100);
  }, [currentMatchNumber, totalMatches]);

  return {
    handleUndo,
    progress,
  };
}
