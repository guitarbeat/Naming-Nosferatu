import { useCallback } from "react";
import {
  buildComparisonsMap,
  getPreferencesMap,
  initializeSorterPairs,
} from "../../../shared/utils/coreUtils";
import { calculateBracketRound } from "../../../shared/utils/tournamentUtils";
import {
  Name,
  Match,
  MatchRecord,
  PersistentState,
  TournamentState,
} from "./types";

interface EloService {
  calculateNewRatings: (
    ratingA: number,
    ratingB: number,
    outcome: string,
    stats: { winsA: number; lossesA: number; winsB: number; lossesB: number },
  ) => {
    newRatingA: number;
    newRatingB: number;
    winsA: number;
    lossesA: number;
    winsB: number;
    lossesB: number;
  };
}

interface TournamentActions {
  setRatings: (
    ratings: Record<string, { rating: number; wins?: number; losses?: number }>,
  ) => void;
}

/**
 * Hook for handling tournament voting logic
 * @param {Object} params - Voting parameters
 * @returns {Object} Vote handlers and rating getters
 */
interface UseTournamentVotingProps {
  names?: Name[];
  userName: string;
  currentMatch: Match | null;
  currentMatchNumber: number;
  roundNumber: number;
  totalMatches: number;
  currentRatings: Record<
    string,
    { rating: number; wins?: number; losses?: number }
  >;
  sorter: unknown;
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
  onComplete?: (
    results: Array<{
      name: string;
      id: string;
      rating: number;
      wins: number;
      losses: number;
    }>,
  ) => void;
  isTransitioning: boolean;
  isError: boolean;
  elo: EloService;
  tournamentActions: TournamentActions;
}

export function useTournamentVoting({
  names = [],
  userName: _userName,
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
}: UseTournamentVotingProps) {
  // * Get current ratings from tournament state
  const getCurrentRatings = useCallback(() => {
    if (!names || names.length === 0) {
      return [];
    }

    return names
      .map((name) => {
        const nameStr = name.name;
        const rating = currentRatings?.[nameStr] || {
          rating: 1500,
          wins: 0,
          losses: 0,
        };
        return {
          name: nameStr,
          id: String(name?.id || nameStr),
          rating: typeof rating === "number" ? rating : rating.rating || 1500,
          wins: rating.wins || 0,
          losses: rating.losses || 0,
        };
      })
      .sort((a, b) => b.rating - a.rating);
  }, [names, currentRatings]);

  // * Handle vote submission
  const handleVote = useCallback(
    (winner: string, voteType: string = "normal") => {
      if (isTransitioning || isError || !currentMatch) {
        return;
      }

      updateTournamentState({ isTransitioning: true });

      const leftName =
        (currentMatch.left as Name)?.name || (currentMatch.left as string);
      const rightName =
        (currentMatch.right as Name)?.name || (currentMatch.right as string);

      // * Determine winner and loser based on vote type
      let winnerName, loserName;

      if (voteType === "both") {
        winnerName = null;
        loserName = null;
      } else if (voteType === "neither") {
        winnerName = null;
        loserName = null;
      } else {
        winnerName = winner === "left" ? leftName : rightName;
        loserName = winner === "left" ? rightName : leftName;
      }

      // * Update Elo ratings
      const newRatings = { ...currentRatings };

      if (elo) {
        // Get current ratings and stats for both names
        const leftRating = newRatings[leftName]?.rating || 1500;
        const rightRating = newRatings[rightName]?.rating || 1500;
        const leftStats = {
          winsA: newRatings[leftName]?.wins || 0,
          lossesA: newRatings[leftName]?.losses || 0,
        };
        const rightStats = {
          winsB: newRatings[rightName]?.wins || 0,
          lossesB: newRatings[rightName]?.losses || 0,
        };

        // Determine outcome based on vote type
        let outcome;
        if (voteType === "both") {
          outcome = "both";
        } else if (voteType === "neither") {
          outcome = "none";
        } else {
          outcome = winner; // "left" or "right"
        }

        // Calculate new ratings using the correct method signature
        const { newRatingA, newRatingB, winsA, lossesA, winsB, lossesB } =
          elo.calculateNewRatings(leftRating, rightRating, outcome, {
            ...leftStats,
            ...rightStats,
          });

        // Update left name
        newRatings[leftName] = {
          ...(newRatings[leftName] || {}),
          rating: newRatingA,
          wins: winsA,
          losses: lossesA,
        };

        // Update right name
        newRatings[rightName] = {
          ...(newRatings[rightName] || {}),
          rating: newRatingB,
          wins: winsB,
          losses: lossesB,
        };
      }

      // * Update sorter preferences, including neutral votes to avoid repeats
      if (sorter) {
        const sorterAny = sorter as Record<string, unknown>;
        const markCompared = (
          left: string,
          right: string,
          value: number = 1,
        ) => {
          if (typeof sorterAny.recordPreference === "function") {
            (
              sorterAny.recordPreference as (
                left: string,
                right: string,
                value: number,
              ) => void
            )(left, right, value);
          } else if (sorterAny.preferences instanceof Map) {
            const key = `${left}-${right}`;
            (sorterAny.preferences as Map<string, number>).set(key, value);
          }
        };

        if (winnerName && loserName) {
          // Standard preference
          markCompared(winnerName, loserName, 1);
        } else if (voteType === "both" || voteType === "neither") {
          // Neutral comparison: mark pair as seen so it doesn't repeat
          markCompared(leftName, rightName, 0);
          markCompared(rightName, leftName, 0);
        }
      }

      // * Save match to history
      const matchRecord = {
        match: currentMatch,
        winner: winnerName,
        loser: loserName,
        voteType,
        matchNumber: currentMatchNumber,
        roundNumber,
        timestamp: Date.now(),
      };

      updatePersistentState({
        matchHistory: [...(persistentState.matchHistory || []), matchRecord],
        currentMatch: currentMatchNumber + 1,
      });

      // * Update tournament store
      if (tournamentActions?.setRatings) {
        tournamentActions.setRatings(newRatings);
      }

      updateTournamentState({
        currentRatings: newRatings,
        canUndo: true,
      });

      // * Check if tournament is complete
      const nextMatchNumber = currentMatchNumber + 1;

      if (nextMatchNumber > totalMatches) {
        setTimeout(() => {
          updateTournamentState({ isTransitioning: false });
          if (onComplete) {
            onComplete(getCurrentRatings());
          }
        }, 300);
        return;
      }

      // * Get next match
      const nextMatch = getNextMatch(names, sorter, nextMatchNumber, {
        currentRatings: newRatings,
        history: [
          ...(persistentState.matchHistory || []),
          matchRecord,
        ] as MatchRecord[],
      });

      // * Calculate new round number using shared utility function
      const newRoundNumber = calculateBracketRound(
        names.length,
        nextMatchNumber,
      );

      setTimeout(() => {
        updateTournamentState({
          currentMatch: nextMatch || null,
          currentMatchNumber: nextMatchNumber,
          roundNumber: newRoundNumber,
          isTransitioning: false,
        });

        if (newRoundNumber !== roundNumber) {
          updatePersistentState({ currentRound: newRoundNumber });
        }
      }, 300);
    },
    [
      isTransitioning,
      isError,
      currentMatch,
      currentMatchNumber,
      roundNumber,
      totalMatches,
      currentRatings,
      sorter,
      persistentState,
      names,
      elo,
      tournamentActions,
      onComplete,
      updateTournamentState,
      updatePersistentState,
      getCurrentRatings,
    ],
  );

  return {
    handleVote,
    getCurrentRatings,
  };
}

// * Internal function to get next match
function getNextMatch(
  names: Name[],
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

  return findBestMatch();
}
