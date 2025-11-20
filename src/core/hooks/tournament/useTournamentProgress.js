import { useCallback, useMemo } from "react";

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
}) {
  const handleUndo = useCallback(() => {
    if (
      isTransitioning ||
      !canUndo ||
      persistentState.matchHistory.length === 0
    ) {
      return;
    }

    updateTournamentState({ isTransitioning: true });

    const lastVote =
      persistentState.matchHistory[persistentState.matchHistory.length - 1];

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

    if (sorter && typeof sorter.undoLastPreference === "function") {
      sorter.undoLastPreference();
    } else if (
      sorter &&
      sorter.preferences instanceof Map &&
      lastVote?.match?.left?.name &&
      lastVote?.match?.right?.name
    ) {
      // * Use optional chaining for safety (already validated above, but defensive)
      const leftName = lastVote.match.left?.name;
      const rightName = lastVote.match.right?.name;
      if (!leftName || !rightName) {
        updateTournamentState({ isTransitioning: false });
        return;
      }
      const key = `${leftName}-${rightName}`;
      const reverseKey = `${rightName}-${leftName}`;
      sorter.preferences.delete(key);
      sorter.preferences.delete(reverseKey);
      if (typeof sorter._pairIndex === "number") {
        const newSorter = { ...sorter };
        newSorter._pairIndex = Math.max(0, sorter._pairIndex - 1);
        updateTournamentState({ sorter: newSorter });
      }
    }

    // * Calculate round based on bracket structure for undo
    // * Need to recalculate which round the previous match was in
    // * After undo, we're back to the match before the one we undid
    if (namesLength > 2 && persistentState.matchHistory.length > 0) {
      // * Get the match number of the last remaining vote (after undo)
      const remainingHistory = persistentState.matchHistory.slice(0, -1);
      const previousMatchNumber = remainingHistory.length > 0 
        ? (remainingHistory[remainingHistory.length - 1]?.matchNumber || currentMatchNumber)
        : currentMatchNumber;
      
      let remainingNames = namesLength;
      let matchesInRound = Math.ceil(remainingNames / 2);
      let matchesPlayed = 0;
      let calculatedRound = 1;
      
      while (matchesPlayed + matchesInRound < previousMatchNumber) {
        matchesPlayed += matchesInRound;
        remainingNames = matchesInRound;
        matchesInRound = Math.ceil(remainingNames / 2);
        calculatedRound++;
      }
      
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
      canUndo: persistentState.matchHistory.length > 1,
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
