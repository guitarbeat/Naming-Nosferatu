import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { PreferenceSorter } from "../../../features/tournament/PreferenceSorter";
import {
  buildComparisonsMap,
  getPreferencesMap,
  initializeSorterPairs,
} from "../../../shared/utils/coreUtils";

import {
  NameItem,
  Match,
  MatchRecord,
  PersistentState,
  TournamentState,
} from "../../../shared/propTypes";

interface UseTournamentStateProps {
  names?: NameItem[];
  existingRatings?: Record<
    string,
    { rating: number; wins?: number; losses?: number }
  >;
  updatePersistentState?: (
    state:
      | Partial<PersistentState>
      | ((prev: PersistentState) => Partial<PersistentState>),
  ) => void;
}

export function useTournamentState({
  names = [],
  existingRatings = {},
  updatePersistentState,
}: UseTournamentStateProps) {
  const [tournamentState, setTournamentState] = useState<TournamentState>({
    currentMatch: null,
    isTransitioning: false,
    roundNumber: 1,
    currentMatchNumber: 1,
    totalMatches: 0,
    canUndo: false,
    currentRatings: existingRatings,
    sorter: null,
    isError: false,
  });

  // * Compute isError as a derived value to avoid setState in effect
  const isError = useMemo(() => {
    return !Array.isArray(names) || (names.length > 0 && names.length < 2);
  }, [names]);

  const updateTournamentState = useCallback(
    (
      updates:
        | Partial<TournamentState>
        | ((prev: TournamentState) => Partial<TournamentState>),
    ) => {
      setTournamentState((prev) => {
        const delta = typeof updates === "function" ? updates(prev) : updates;
        return { ...prev, ...delta };
      });
    },
    [],
  );

  const lastInitKeyRef = useRef("");

  // * Initialize tournament when names change
  useEffect(() => {
    if (!Array.isArray(names) || names.length < 2) {
      return;
    }

    const namesKey = names
      .map((n) => n?.id || n?.name || "")
      .filter(Boolean)
      .join(",");
    if (lastInitKeyRef.current === namesKey) {
      return;
    }

    lastInitKeyRef.current = namesKey;
    const nameStrings = names.map((n) => n?.name || "").filter(Boolean);
    const newSorter = new PreferenceSorter(nameStrings);

    // * Bracket tournament: names.length - 1 matches total
    // * For 4 names: 3 matches (2 in round 1, 1 in round 2)
    // * For 3 names: 2 matches (1 in round 1, 1 in round 2)
    const estimatedMatches = names.length > 1 ? names.length - 1 : 0;

    setTournamentState((prev) => ({
      ...prev,
      sorter: newSorter,
      totalMatches: estimatedMatches,
      currentMatchNumber: 1,
      roundNumber: 1,
      canUndo: false,
      currentRatings: existingRatings,
    }));

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
        setTournamentState((prev) => ({ ...prev, currentMatch: first }));
      } else {
        const [left, right] = names;
        setTournamentState((prev) => ({
          ...prev,
          currentMatch: { left, right },
        }));
      }
    }
    // * updatePersistentState is a callback prop that should be stable
    // * getNextMatch is an imported utility function (stable reference)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [names, existingRatings]);

  useEffect(() => {
    if (isError && process.env.NODE_ENV === "development") {
      console.warn("[DEV] 🎮 useTournament: Invalid names array detected");
    }
  }, [isError]);

  // * No cleanup needed - component unmounting will clear state naturally

  return {
    tournamentState: { ...tournamentState, isError },
    updateTournamentState,
  };
}

// * Internal function - not exported (only used within this file)
function getNextMatch(
  names: NameItem[],
  sorter: unknown,
  _matchNumber: number,
  options: {
    currentRatings?: Record<
      string,
      { rating: number; wins?: number; losses?: number }
    >;
    history?: MatchRecord[];
  } = {},
): Match | null {
  if (!sorter || names.length <= 2) {
    return null;
  }

  const findBestMatch = () => {
    try {
      // Convert names to NameItem[] format for initializeSorterPairs
      const nameList = names.filter((n) => n && n.name);
      const sorterAny = sorter as Record<string, unknown>;
      initializeSorterPairs(sorter, nameList);

      // * Ensure _pairs is initialized before accessing
      if (
        !Array.isArray(sorterAny._pairs) ||
        (sorterAny._pairs as unknown[]).length === 0
      ) {
        return null;
      }

      const prefs = getPreferencesMap(sorter);
      const ratings = options.currentRatings || {};
      const history = options.history || [];
      // Convert MatchRecord[] to ComparisonHistory[] format
      const comparisonHistory = history
        .filter((h) => h.winner && h.loser)
        .map((h) => ({
          winner: h.winner as string,
          loser: h.loser as string,
        }));
      const comparisons = buildComparisonsMap(comparisonHistory);

      let bestPair: [string, string] | null = null;
      let bestScore = Infinity;
      const pairIndex =
        typeof sorterAny._pairIndex === "number"
          ? (sorterAny._pairIndex as number)
          : 0;
      for (
        let idx = pairIndex;
        idx < (sorterAny._pairs as Array<[string, string]>).length;
        idx++
      ) {
        const [a, b] = (sorterAny._pairs as Array<[string, string]>)[idx];
        const key = `${a}-${b}`;
        const reverseKey = `${b}-${a}`;
        if (prefs.has(key) || prefs.has(reverseKey)) continue;
        const ratingA = ratings[a];
        const ra =
          (typeof ratingA === "object" && ratingA?.rating) ||
          (typeof ratingA === "number" ? ratingA : 1500);
        const ratingB = ratings[b];
        const rb =
          (typeof ratingB === "object" && ratingB?.rating) ||
          (typeof ratingB === "number" ? ratingB : 1500);
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
        const sorterAny = sorter as Record<string, unknown>;
        sorterAny._pairIndex = Math.max(
          0,
          (sorterAny._pairs as Array<[string, string]>).findIndex(
            (p: [string, string]) => p[0] === a && p[1] === b,
          ),
        );
        return {
          left: names.find((n) => n?.name === a) || { name: a, id: a },
          right: names.find((n) => n?.name === b) || { name: b, id: b },
        } as Match;
      }
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.warn("Adaptive next-match selection failed:", e);
      }
    }
    return null;
  };

  if (options && (options.currentRatings || options.history)) {
    const match = findBestMatch();
    if (match) return match;
  }

  const sorterAny = sorter as Record<string, unknown>;
  if (typeof sorterAny.getNextMatch === "function") {
    try {
      const nextMatch = (
        sorterAny.getNextMatch as () => { left: string; right: string } | null
      )();
      if (nextMatch) {
        const leftName = names.find((n) => n?.name === nextMatch.left);
        const rightName = names.find((n) => n?.name === nextMatch.right);

        return {
          left: leftName || { name: nextMatch.left, id: nextMatch.left },
          right: rightName || { name: nextMatch.right, id: nextMatch.right },
        } as Match;
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("Could not get next match from sorter:", error);
      }
    }
  }

  // Fallback to finding best match if sorter failed or wasn't used initially
  return findBestMatch();
}
