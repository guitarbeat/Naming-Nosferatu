import { useMemo, useCallback, useEffect, useRef, useState } from "react";
import EloRating from "../../features/tournament/EloRating";
import useAppStore from "../store/useAppStore";
import useLocalStorage from "./useStorage";
import { PreferenceSorter } from "../../features/tournament/PreferenceSorter";
import {
  buildComparisonsMap,
  getPreferencesMap,
  initializeSorterPairs,
  calculateBracketRound,
} from "../../shared/utils/coreUtils";
import {
  NameItem,
  Match,
  MatchRecord,
  PersistentState,
  TournamentState,
} from "../../shared/propTypes";

// ============================================================================
// Types & Defaults
// ============================================================================

const createDefaultPersistentState = (userName: string): PersistentState => ({
  matchHistory: [],
  currentRound: 1,
  currentMatch: 1,
  totalMatches: 0,
  userName: userName || "anonymous",
  lastUpdated: Date.now(),
  namesKey: "",
});

interface UseTournamentProps {
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
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Custom hook for managing tournament state and logic
 * Consolidates persistence, progress, and voting logic.
 */
export function useTournament({
  names = [],
  existingRatings = {},
  onComplete,
}: UseTournamentProps = {}) {
  // --- Setup ---
  const elo = useMemo(() => new EloRating(), []);
  const userName = useAppStore((state) => state.user.name);
  const tournament = useAppStore((state) => state.tournament);
  const { ratings: currentRatings } = tournament;
  const { tournamentActions } = useAppStore();

  // --- Persistence ---
  const tournamentId = useMemo(() => {
    const sortedNames = [...names]
      .map((n: NameItem) => n.name || n)
      .sort()
      .join("-");
    const prefix = userName || "anonymous";
    return `tournament-${prefix}-${sortedNames}`;
  }, [names, userName]);

  const defaultPersistentState = useMemo(
    () => createDefaultPersistentState(userName),
    [userName],
  );

  const [persistentStateRaw, setPersistentState] =
    useLocalStorage<PersistentState>(tournamentId, defaultPersistentState);

  // Safety wrapper for persistentState
  const persistentState = useMemo(() => {
    if (!persistentStateRaw || typeof persistentStateRaw !== "object" || Array.isArray(persistentStateRaw)) {
      return createDefaultPersistentState(userName);
    }
    return {
      ...createDefaultPersistentState(userName),
      ...persistentStateRaw,
      matchHistory: Array.isArray(persistentStateRaw.matchHistory) ? persistentStateRaw.matchHistory : [],
    };
  }, [persistentStateRaw, userName]);

  const updatePersistentState = useCallback(
    (updates: Partial<PersistentState> | ((prev: PersistentState) => Partial<PersistentState>)) => {
      setPersistentState((prev: PersistentState) => {
        const delta = typeof updates === "function" ? updates(prev) || {} : updates || {};
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
    if (persistentState && persistentState.userName !== (userName || "anonymous")) {
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

  // --- Intermediate State ---
  const [tState, setTState] = useState<TournamentState>({
    currentMatch: null,
    isTransitioning: false,
    roundNumber: persistentState.currentRound || 1,
    currentMatchNumber: persistentState.currentMatch || 1,
    totalMatches: persistentState.totalMatches || 0,
    canUndo: persistentState.matchHistory.length > 1,
    currentRatings: existingRatings,
    sorter: null,
    isError: !Array.isArray(names) || (names.length > 0 && names.length < 2),
  });

  const updateTournamentState = useCallback((updates: Partial<TournamentState> | ((prev: TournamentState) => Partial<TournamentState>)) => {
    setTState((prev) => {
      const delta = typeof updates === "function" ? updates(prev) : updates;
      return { ...prev, ...delta };
    });
  }, []);

  const lastInitKeyRef = useRef("");

  // Initialize tournament when names change
  useEffect(() => {
    if (!Array.isArray(names) || names.length < 2) return;

    const namesKey = names.map((n) => n?.id || n?.name || "").filter(Boolean).sort().join(",");
    if (lastInitKeyRef.current === namesKey) return;

    lastInitKeyRef.current = namesKey;
    const nameStrings = names.map((n) => n?.name || "").filter(Boolean);
    const newSorter = new PreferenceSorter(nameStrings);
    const estimatedMatches = names.length > 1 ? names.length - 1 : 0;

    updateTournamentState({
      sorter: newSorter,
      totalMatches: estimatedMatches,
      currentMatchNumber: 1,
      roundNumber: 1,
      canUndo: false,
      currentRatings: existingRatings,
    });

    updatePersistentState({
      matchHistory: [],
      currentRound: 1,
      currentMatch: 1,
      totalMatches: estimatedMatches,
      namesKey,
    });

    const first = getNextMatch(names, newSorter, 1, { currentRatings: existingRatings, history: [] });
    if (first) {
      updateTournamentState({ currentMatch: first });
    } else if (names.length >= 2) {
      updateTournamentState({ currentMatch: { left: names[0], right: names[1] } });
    }
  }, [names, existingRatings, updateTournamentState, updatePersistentState]);

  // --- Voting Logic ---
  const getCurrentRatings = useCallback(() => {
    if (!names || names.length === 0) return [];
    return names.map((name) => {
      const nameStr = name.name;
      const rating = currentRatings?.[nameStr] || { rating: 1500, wins: 0, losses: 0 };
      return {
        name: nameStr,
        id: String(name?.id || nameStr),
        rating: typeof rating === "number" ? rating : rating.rating || 1500,
        wins: rating.wins || 0,
        losses: rating.losses || 0,
      };
    }).sort((a, b) => b.rating - a.rating);
  }, [names, currentRatings]);

  const handleVote = useCallback((winner: string, voteType: string = "normal") => {
    if (tState.isTransitioning || tState.isError || !tState.currentMatch) return;

    updateTournamentState({ isTransitioning: true });

    const leftName = (tState.currentMatch.left as NameItem)?.name || (tState.currentMatch.left as string);
    const rightName = (tState.currentMatch.right as NameItem)?.name || (tState.currentMatch.right as string);

    let winnerName: string | null = null;
    let loserName: string | null = null;

    if (voteType === "left") { winnerName = leftName; loserName = rightName; }
    else if (voteType === "right") { winnerName = rightName; loserName = leftName; }
    else if (winner === "left") { winnerName = leftName; loserName = rightName; }
    else if (winner === "right") { winnerName = rightName; loserName = leftName; }

    const newRatings = { ...currentRatings };
    if (elo) {
      const leftRating = newRatings[leftName]?.rating || 1500;
      const rightRating = newRatings[rightName]?.rating || 1500;
      const leftStats = { winsA: newRatings[leftName]?.wins || 0, lossesA: newRatings[leftName]?.losses || 0 };
      const rightStats = { winsB: newRatings[rightName]?.wins || 0, lossesB: newRatings[rightName]?.losses || 0 };

      const outcome: string = voteType === "both" ? "both" : voteType === "neither" ? "none" : winner === "left" || voteType === "left" ? "left" : "right";

      const r = elo.calculateNewRatings(leftRating, rightRating, outcome, { ...leftStats, ...rightStats });

      newRatings[leftName] = { ...(newRatings[leftName] || {}), rating: r.newRatingA, wins: r.winsA, losses: r.lossesA };
      newRatings[rightName] = { ...(newRatings[rightName] || {}), rating: r.newRatingB, wins: r.winsB, losses: r.lossesB };
    }

    if (tState.sorter) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const s = tState.sorter as any;
      if (winnerName && loserName) {
        if (typeof s.recordPreference === "function") s.recordPreference(winnerName, loserName, 1);
        else if (s.preferences instanceof Map) s.preferences.set(`${winnerName}-${loserName}`, 1);
      } else if (voteType === "both" || voteType === "neither") {
        if (typeof s.recordPreference === "function") {
          s.recordPreference(leftName, rightName, 0);
          s.recordPreference(rightName, leftName, 0);
        } else if (s.preferences instanceof Map) {
          s.preferences.set(`${leftName}-${rightName}`, 0);
          s.preferences.set(`${rightName}-${leftName}`, 0);
        }
      }
    }

    const matchRecord: MatchRecord = {
      match: tState.currentMatch,
      winner: winnerName,
      loser: loserName,
      voteType,
      matchNumber: tState.currentMatchNumber,
      roundNumber: tState.roundNumber,
      timestamp: Date.now(),
    };

    const nextMatchNumber = tState.currentMatchNumber + 1;
    updatePersistentState({
      matchHistory: [...(persistentState.matchHistory || []), matchRecord],
      currentMatch: nextMatchNumber,
    });

    if (tournamentActions?.setRatings) tournamentActions.setRatings(newRatings);
    updateTournamentState({ currentRatings: newRatings, canUndo: true });

    if (nextMatchNumber > tState.totalMatches) {
      setTimeout(() => {
        updateTournamentState({ isTransitioning: false });
        if (onComplete) onComplete(getCurrentRatings());
      }, 300);
      return;
    }

    const nextMatch = getNextMatch(names, tState.sorter, nextMatchNumber, {
      currentRatings: newRatings,
      history: [...(persistentState.matchHistory || []), matchRecord],
    });

    const newRoundNumber = calculateBracketRound(names.length, nextMatchNumber);
    setTimeout(() => {
      updateTournamentState({
        currentMatch: nextMatch || null,
        currentMatchNumber: nextMatchNumber,
        roundNumber: newRoundNumber,
        isTransitioning: false,
      });
      if (newRoundNumber !== tState.roundNumber) updatePersistentState({ currentRound: newRoundNumber });
    }, 300);
  }, [tState, currentRatings, elo, tournamentActions, updatePersistentState, updateTournamentState, names, onComplete, getCurrentRatings, persistentState.matchHistory]);

  // --- Progress Logic ---
  const handleUndo = useCallback(() => {
    if (tState.isTransitioning || !tState.canUndo || persistentState.matchHistory.length === 0) return;

    updateTournamentState({ isTransitioning: true });
    const history = persistentState.matchHistory;
    const lastVote = history[history.length - 1];
    if (!lastVote || !lastVote.match) {
      updateTournamentState({ isTransitioning: false });
      return;
    }

    updateTournamentState({
      currentMatch: lastVote.match,
      currentMatchNumber: lastVote.matchNumber || 1,
    });

    const newHistory = history.slice(0, -1);
    updatePersistentState({ matchHistory: newHistory });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = tState.sorter as any;
    if (s) {
      if (typeof s.undoLastPreference === "function") s.undoLastPreference();
      else if (s.preferences instanceof Map) {
        const ln = (lastVote.match.left as NameItem)?.name || (lastVote.match.left as string);
        const rn = (lastVote.match.right as NameItem)?.name || (lastVote.match.right as string);
        if (ln && rn) {
          s.preferences.delete(`${ln}-${rn}`);
          s.preferences.delete(`${rn}-${ln}`);
          // eslint-disable-next-line react-hooks/immutability
          if (typeof s._pairIndex === "number") s._pairIndex = Math.max(0, s._pairIndex - 1);
        }
      }
    }

    if (names.length >= 2 && newHistory.length > 0) {
      const prevMatchNumber = newHistory[newHistory.length - 1]?.matchNumber || tState.currentMatchNumber;
      const calcRound = calculateBracketRound(names.length, prevMatchNumber);
      if (calcRound !== tState.roundNumber) {
        updateTournamentState({ roundNumber: calcRound });
        updatePersistentState({ currentRound: calcRound });
      }
    } else if (newHistory.length === 0) {
      updateTournamentState({ roundNumber: 1 });
      updatePersistentState({ currentRound: 1 });
    }

    updateTournamentState({ canUndo: newHistory.length > 0 });
    setTimeout(() => updateTournamentState({ isTransitioning: false }), 500);
  }, [tState, persistentState.matchHistory, updateTournamentState, updatePersistentState, names.length]);

  const progressValue = useMemo(() => {
    if (!tState.totalMatches) return 0;
    return Math.round((tState.currentMatchNumber / tState.totalMatches) * 100);
  }, [tState.currentMatchNumber, tState.totalMatches]);

  // --- Return ---
  if (tState.isError) {
    return {
      currentMatch: null,
      handleVote: () => { },
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

  return {
    currentMatch: tState.currentMatch,
    isTransitioning: tState.isTransitioning,
    roundNumber: tState.roundNumber,
    currentMatchNumber: tState.currentMatchNumber,
    totalMatches: tState.totalMatches,
    progress: progressValue,
    handleVote,
    handleUndo,
    canUndo: tState.canUndo,
    getCurrentRatings,
    isError: tState.isError,
    matchHistory: persistentState.matchHistory,
    userName: persistentState.userName,
  };
}

// ============================================================================
// Internal Helpers
// ============================================================================

function getNextMatch(
  names: NameItem[],
  sorter: unknown,
  _matchNumber: number,
  options: {
    currentRatings?: Record<string, { rating: number; wins?: number; losses?: number }>;
    history?: MatchRecord[];
  } = {},
): Match | null {
  if (!sorter || names.length <= 2) return null;

  const findBestMatch = () => {
    try {
      const nameList = names.filter((n) => n && n.name);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const s = sorter as any;
      initializeSorterPairs(sorter, nameList);

      if (!Array.isArray(s._pairs) || s._pairs.length === 0) return null;

      const prefs = getPreferencesMap(sorter);
      const ratings = options.currentRatings || {};
      const history = options.history || [];
      const compHistory = history.filter((h) => h.winner && h.loser).map((h) => ({
        winner: h.winner as string,
        loser: h.loser as string,
      }));
      const comparisons = buildComparisonsMap(compHistory);

      let bestPair: [string, string] | null = null;
      let bestScore = Infinity;
      const pairIndex = typeof s._pairIndex === "number" ? s._pairIndex : 0;

      for (let idx = pairIndex; idx < s._pairs.length; idx++) {
        const [a, b] = s._pairs[idx];
        if (prefs.has(`${a}-${b}`) || prefs.has(`${b}-${a}`)) continue;

        const ra = ratings[a]?.rating || (typeof ratings[a] === "number" ? ratings[a] : 1500);
        const rb = ratings[b]?.rating || (typeof ratings[b] === "number" ? ratings[b] : 1500);
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        s._pairIndex = Math.max(0, s._pairs.findIndex((p: any) => p[0] === a && p[1] === b));
        return {
          left: names.find((n) => n?.name === a) || { name: a, id: a },
          right: names.find((n) => n?.name === b) || { name: b, id: b },
        } as Match;
      }
    } catch (e) {
      if (process.env.NODE_ENV === "development") console.warn("Adaptive next-match selection failed:", e);
    }
    return null;
  };

  if (options && (options.currentRatings || options.history)) {
    const match = findBestMatch();
    if (match) return match;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = sorter as any;
  if (typeof s.getNextMatch === "function") {
    try {
      const nm = s.getNextMatch();
      if (nm) {
        return {
          left: names.find((n) => n?.name === nm.left) || { name: nm.left, id: nm.left },
          right: names.find((n) => n?.name === nm.right) || { name: nm.right, id: nm.right },
        } as Match;
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") console.warn("Could not get next match from sorter:", error);
    }
  }

  return findBestMatch();
}
