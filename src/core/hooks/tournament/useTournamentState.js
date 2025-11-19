import { useState, useCallback, useEffect, useRef } from "react";
import { PreferenceSorter } from "../../../features/tournament/PreferenceSorter";
import {
  buildComparisonsMap,
  getPreferencesMap,
  initializeSorterPairs,
} from "../../../shared/utils/coreUtils";

export function useTournamentState({
  names = [],
  existingRatings = {},
  updatePersistentState,
}) {
  const [tournamentState, setTournamentState] = useState({
    currentMatch: null,
    isTransitioning: false,
    roundNumber: 1,
    currentMatchNumber: 1,
    totalMatches: 0,
    canUndo: false,
    currentRatings: existingRatings,
    isError: false,
    sorter: null,
  });

  const updateTournamentState = useCallback((updates) => {
    setTournamentState((prev) => ({ ...prev, ...updates }));
  }, []);

  const lastInitKeyRef = useRef("");

  const initializeTournament = useCallback(() => {
    if (!Array.isArray(names) || names.length < 2) {
      return;
    }

    const namesKey = names.map((n) => n.id || n.name).join(",");
    if (lastInitKeyRef.current === namesKey) {
      return;
    }

    lastInitKeyRef.current = namesKey;
    const nameStrings = names.map((n) => n.name);
    const newSorter = new PreferenceSorter(nameStrings);

    const estimatedMatches =
      names.length === 2
        ? 1
        : names.length > 0
          ? Math.ceil(names.length * Math.log2(Math.max(1, names.length)))
          : 0;

    updateTournamentState({
      sorter: newSorter,
      totalMatches: estimatedMatches,
      currentMatchNumber: 1,
      roundNumber: 1,
      canUndo: false,
      currentRatings: existingRatings,
      isError: false,
    });

    updatePersistentState?.({
      matchHistory: [],
      currentRound: 1,
      currentMatch: 1,
      totalMatches: estimatedMatches,
      namesKey,
    });

    if (names.length >= 2) {
      const first = getNextMatch(names, newSorter, 1, {
        currentRatings: existingRatings,
        history: [],
      });
      if (first) {
        updateTournamentState({ currentMatch: first });
      } else {
        const [left, right] = names;
        updateTournamentState({ currentMatch: { left, right } });
      }
    }
  }, [names, existingRatings, updatePersistentState, updateTournamentState]);

  const { isError } = tournamentState;

  useEffect(() => {
    initializeTournament();
  }, [initializeTournament]);

  useEffect(() => {
    const invalid =
      !Array.isArray(names) || (names.length > 0 && names.length < 2);
    if (invalid !== isError) {
      if (invalid && process.env.NODE_ENV === "development") {
        console.warn("[DEV] 🎮 useTournament: Invalid names array detected");
      }
      updateTournamentState({ isError: invalid });
    }
  }, [names, isError, updateTournamentState]);

  useEffect(() => {
    return () => {
      updateTournamentState({
        currentMatch: null,
        isTransitioning: false,
        currentMatchNumber: 1,
        roundNumber: 1,
      });
    };
  }, [updateTournamentState]);

  return {
    tournamentState,
    updateTournamentState,
  };
}

export function getNextMatch(names, sorter, _matchNumber, options = {}) {
  if (!sorter || names.length <= 2) {
    return null;
  }

  if (options && (options.currentRatings || options.history)) {
    try {
      const nameList = names.map((n) => n.name);
      initializeSorterPairs(sorter, nameList);

      const prefs = getPreferencesMap(sorter);
      const ratings = options.currentRatings || {};
      const history = options.history || [];
      const comparisons = buildComparisonsMap(history);

      let bestPair = null;
      let bestScore = Infinity;
      for (let idx = sorter._pairIndex; idx < sorter._pairs.length; idx++) {
        const [a, b] = sorter._pairs[idx];
        const key = `${a}-${b}`;
        const reverseKey = `${b}-${a}`;
        if (prefs.has(key) || prefs.has(reverseKey)) continue;
        const ra =
          ratings[a]?.rating ??
          (typeof ratings[a] === "number" ? ratings[a] : 1500);
        const rb =
          ratings[b]?.rating ??
          (typeof ratings[b] === "number" ? ratings[b] : 1500);
        const diff = Math.abs(ra - rb);
        const ca = comparisons.get(a) || 0;
        const cb = comparisons.get(b) || 0;
        const uncScore = 1 / (1 + ca) + 1 / (1 + cb);
        const score = diff - 50 * uncScore;
        if (score < bestScore) {
          bestScore = score;
          bestPair = [a, b];
        }
      }

      if (bestPair) {
        const [a, b] = bestPair;
        sorter._pairIndex = Math.max(
          0,
          sorter._pairs.findIndex((p) => p[0] === a && p[1] === b),
        );
        return {
          left: names.find((n) => n.name === a) || { name: a },
          right: names.find((n) => n.name === b) || { name: b },
        };
      }
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.warn("Adaptive next-match selection failed:", e);
      }
    }
  }

  if (typeof sorter.getNextMatch === "function") {
    try {
      const nextMatch = sorter.getNextMatch();
      if (nextMatch) {
        const leftName = names.find((n) => n.name === nextMatch.left);
        const rightName = names.find((n) => n.name === nextMatch.right);

        return {
          left: leftName || { name: nextMatch.left, id: nextMatch.left },
          right: rightName || { name: nextMatch.right, id: nextMatch.right },
        };
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("Could not get next match from sorter:", error);
      }
    }
  }

  try {
    const nameList = names.map((n) => n.name);
    initializeSorterPairs(sorter, nameList);

    const prefs = getPreferencesMap(sorter);
    const ratings = options.currentRatings || {};
    const history = options.history || [];
    const comparisons = buildComparisonsMap(history);

    let bestPair = null;
    let bestScore = Infinity;

    for (let idx = sorter._pairIndex; idx < sorter._pairs.length; idx++) {
      const [a, b] = sorter._pairs[idx];
      const key = `${a}-${b}`;
      const reverseKey = `${b}-${a}`;
      if (prefs.has(key) || prefs.has(reverseKey)) continue;

      const ra =
        ratings[a]?.rating ??
        (typeof ratings[a] === "number" ? ratings[a] : 1500);
      const rb =
        ratings[b]?.rating ??
        (typeof ratings[b] === "number" ? ratings[b] : 1500);
      const diff = Math.abs(ra - rb);

      const ca = comparisons.get(a) || 0;
      const cb = comparisons.get(b) || 0;
      const uncScore = 1 / (1 + ca) + 1 / (1 + cb);

      const score = diff - 50 * uncScore;

      if (score < bestScore) {
        bestScore = score;
        bestPair = [a, b];
      }
    }

    if (bestPair) {
      const [a, b] = bestPair;
      sorter._pairIndex = Math.max(
        0,
        sorter._pairs.findIndex((p) => p[0] === a && p[1] === b),
      );
      return {
        left: names.find((n) => n.name === a) || { name: a },
        right: names.find((n) => n.name === b) || { name: b },
      };
    }
  } catch (e) {
    console.warn("Fallback next-match generation failed:", e);
  }

  return null;
}

