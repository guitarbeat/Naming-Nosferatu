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

  // * Create default state once
  const defaultState = useMemo(
    () => createDefaultPersistentState(userName),
    [userName],
  );

  const [persistentState, setPersistentState] = useLocalStorage(
    tournamentId,
    defaultState,
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
    // * Only update if persistentState exists and userName has changed
    if (
      persistentState &&
      persistentState.userName !== (userName || "anonymous")
    ) {
      updatePersistentState({
        matchHistory: [],
        currentRound: 1,
        currentMatch: 1,
        totalMatches: 0,
        userName: userName || "anonymous",
        namesKey: "",
      });
    }
  }, [persistentState, updatePersistentState, userName]);

  // * Ensure persistentState has all required properties
  const safePersistentState = useMemo(() => {
    // * Handle cases where persistentState might be undefined, null, or not an object
    if (
      !persistentState ||
      typeof persistentState !== "object" ||
      Array.isArray(persistentState)
    ) {
      return createDefaultPersistentState(userName);
    }
    return {
      ...createDefaultPersistentState(userName),
      ...persistentState,
      matchHistory: Array.isArray(persistentState.matchHistory)
        ? persistentState.matchHistory
        : [],
    };
  }, [persistentState, userName]);

  return {
    persistentState: safePersistentState,
    updatePersistentState,
    roundNumber: safePersistentState.currentRound || 1,
    currentMatchNumber: safePersistentState.currentMatch || 1,
    totalMatches: safePersistentState.totalMatches || 0,
    canUndo: Array.isArray(safePersistentState.matchHistory)
      ? safePersistentState.matchHistory.length > 1
      : false,
  };
}
