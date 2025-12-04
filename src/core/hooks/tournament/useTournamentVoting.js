import { useCallback } from "react";
import {
  buildComparisonsMap,
  getPreferencesMap,
  initializeSorterPairs,
} from "../../../shared/utils/coreUtils";

/**
 * Hook for handling tournament voting logic
 * @param {Object} params - Voting parameters
 * @returns {Object} Vote handlers and rating getters
 */
export function useTournamentVoting({
  names = [],
  userName,
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
}) {
  // * Get current ratings from tournament state
  const getCurrentRatings = useCallback(() => {
    if (!names || names.length === 0) {
      return [];
    }

    return names
      .map((name) => {
        const nameStr = name?.name || name;
        const rating = currentRatings?.[nameStr] || {
          rating: 1500,
          wins: 0,
          losses: 0,
        };
        return {
          name: nameStr,
          id: name?.id || nameStr,
          rating: typeof rating === "number" ? rating : rating.rating || 1500,
          wins: rating.wins || 0,
          losses: rating.losses || 0,
        };
      })
      .sort((a, b) => b.rating - a.rating);
  }, [names, currentRatings]);

  // * Handle vote submission
  const handleVote = useCallback(
    (winner, voteType = "normal") => {
      if (isTransitioning || isError || !currentMatch) {
        return;
      }

      updateTournamentState({ isTransitioning: true });

      const leftName = currentMatch.left?.name || currentMatch.left;
      const rightName = currentMatch.right?.name || currentMatch.right;

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
      
      if (winnerName && loserName && elo) {
        const winnerRating = newRatings[winnerName]?.rating || 1500;
        const loserRating = newRatings[loserName]?.rating || 1500;
        
        const { winner: newWinnerRating, loser: newLoserRating } = elo.calculateNewRatings(
          winnerRating,
          loserRating
        );

        newRatings[winnerName] = {
          ...(newRatings[winnerName] || {}),
          rating: newWinnerRating,
          wins: (newRatings[winnerName]?.wins || 0) + 1,
        };
        
        newRatings[loserName] = {
          ...(newRatings[loserName] || {}),
          rating: newLoserRating,
          losses: (newRatings[loserName]?.losses || 0) + 1,
        };
      }

      // * Update sorter preferences
      if (sorter && winnerName && loserName) {
        if (typeof sorter.recordPreference === "function") {
          sorter.recordPreference(winnerName, loserName);
        } else if (sorter.preferences instanceof Map) {
          const key = `${winnerName}-${loserName}`;
          sorter.preferences.set(key, 1);
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
        history: [...(persistentState.matchHistory || []), matchRecord],
      });

      // * Calculate new round number based on bracket structure
      let newRoundNumber = roundNumber;
      if (names.length > 2) {
        let remainingNames = names.length;
        let matchesInRound = Math.floor(remainingNames / 2);
        let matchesPlayed = 0;

        while (matchesPlayed + matchesInRound < nextMatchNumber) {
          matchesPlayed += matchesInRound;
          const winners = matchesInRound;
          const byes = remainingNames % 2;
          remainingNames = winners + byes;
          matchesInRound = Math.floor(remainingNames / 2);
          newRoundNumber++;
        }
      }

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
    ]
  );

  return {
    handleVote,
    getCurrentRatings,
  };
}

// * Internal function to get next match
function getNextMatch(names, sorter, _matchNumber, options = {}) {
  if (!sorter || names.length <= 2) {
    return null;
  }

  const findBestMatch = () => {
    try {
      const nameList = names.map((n) => n?.name || "").filter(Boolean);
      initializeSorterPairs(sorter, nameList);

      if (!Array.isArray(sorter._pairs) || sorter._pairs.length === 0) {
        return null;
      }

      const prefs = getPreferencesMap(sorter);
      const ratings = options.currentRatings || {};
      const history = options.history || [];
      const comparisons = buildComparisonsMap(history);

      let bestPair = null;
      let bestScore = Infinity;
      const pairIndex =
        typeof sorter._pairIndex === "number" ? sorter._pairIndex : 0;
        
      for (let idx = pairIndex; idx < sorter._pairs.length; idx++) {
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
          sorter._pairs.findIndex((p) => p[0] === a && p[1] === b)
        );
        return {
          left: names.find((n) => n?.name === a) || { name: a },
          right: names.find((n) => n?.name === b) || { name: b },
        };
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

  if (typeof sorter.getNextMatch === "function") {
    try {
      const nextMatch = sorter.getNextMatch();
      if (nextMatch) {
        const leftName = names.find((n) => n?.name === nextMatch.left);
        const rightName = names.find((n) => n?.name === nextMatch.right);

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

  return findBestMatch();
}
