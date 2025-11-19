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
      const key = `${lastVote.match.left.name}-${lastVote.match.right.name}`;
      const reverseKey = `${lastVote.match.right.name}-${lastVote.match.left.name}`;
      sorter.preferences.delete(key);
      sorter.preferences.delete(reverseKey);
      if (typeof sorter._pairIndex === "number") {
        const newSorter = { ...sorter };
        newSorter._pairIndex = Math.max(0, sorter._pairIndex - 1);
        updateTournamentState({ sorter: newSorter });
      }
    }

    if (currentMatchNumber % Math.ceil(namesLength / 2) === 1) {
      updateTournamentState({ roundNumber: roundNumber - 1 });
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

