import { useMemo, useCallback, useEffect } from "react";
import useLocalStorage from "../useLocalStorage";

const createDefaultPersistentState = (userName) => ({
  matchHistory: [],
  currentRound: 1,
  currentMatch: 1,
  totalMatches: 0,
  userName: userName || "anonymous",
  lastUpdated: Date.now(),
  namesKey: "",
});

export function useTournamentPersistence({ names = [], userName }) {
  const tournamentId = useMemo(() => {
    const sortedNames = [...names]
      .map((n) => n.name)
      .sort()
      .join("-");
    const prefix = userName || "anonymous";
    return `tournament-${prefix}-${sortedNames}`;
  }, [names, userName]);

  const [persistentState, setPersistentState] = useLocalStorage(
    tournamentId,
    () => createDefaultPersistentState(userName),
  );

  const updatePersistentState = useCallback(
    (updates) => {
      setPersistentState((prev) => {
        const delta =
          typeof updates === "function" ? updates(prev) || {} : updates || {};
        return {
          ...prev,
          ...delta,
          lastUpdated: Date.now(),
          userName: userName || "anonymous",
        };
      });
    },
    [setPersistentState, userName],
  );

  useEffect(() => {
    if (persistentState.userName !== (userName || "anonymous")) {
      updatePersistentState({
        matchHistory: [],
        currentRound: 1,
        currentMatch: 1,
        totalMatches: 0,
        userName: userName || "anonymous",
        namesKey: "",
      });
    }
  }, [persistentState.userName, updatePersistentState, userName]);

  return {
    persistentState,
    updatePersistentState,
    roundNumber: persistentState.currentRound,
    currentMatchNumber: persistentState.currentMatch,
    totalMatches: persistentState.totalMatches,
    canUndo: persistentState.matchHistory.length > 1,
  };
}

