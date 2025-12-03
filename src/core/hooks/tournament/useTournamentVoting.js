import { useCallback, useRef, useEffect } from "react";
import { getNextMatch } from "./useTournamentState";
import { computeRating } from "../../../shared/utils/coreUtils";
import { ErrorManager } from "../../../shared/services/errorManager";

export function useTournamentVoting({
  names,
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
  // * Ref to track transition timeout for cleanup
  const transitionTimeoutRef = useRef(null);

  // * Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  // * Helper function to calculate ratings from history and ratings data
  const calculateRatingsFromData = useCallback(
    (historyData, ratingsData, matchNum) => {
      const countPlayerVotes = (playerName, outcome) => {
        return historyData.filter((vote) => {
          if (!vote?.match) return false;
          const { left, right } = vote.match;
          if (!left || !right) return false;
          if (outcome === "win") {
            return (
              (left.name === playerName && vote.result === "left") ||
              (right.name === playerName && vote.result === "right")
            );
          }
          if (outcome === "loss") {
            return (
              (left.name === playerName && vote.result === "right") ||
              (right.name === playerName && vote.result === "left")
            );
          }
          return false;
        }).length;
      };

      return names.map((name) => {
        const existingData =
          typeof ratingsData[name.name] === "object"
            ? ratingsData[name.name]
            : { rating: ratingsData[name.name] || 1500, wins: 0, losses: 0 };

        const wins = countPlayerVotes(name.name, "win");
        const losses = countPlayerVotes(name.name, "loss");
        const position = wins;

        const finalRating = computeRating(
          existingData.rating,
          position,
          names.length,
          matchNum,
          totalMatches,
        );

        return {
          name: name.name,
          rating: finalRating,
          wins: existingData.wins + wins,
          losses: existingData.losses + losses,
          confidence: totalMatches > 0 ? matchNum / totalMatches : 0,
        };
      });
    },
    [names, totalMatches],
  );

  const getCurrentRatings = useCallback(() => {
    return calculateRatingsFromData(
      persistentState.matchHistory,
      currentRatings,
      currentMatchNumber,
    );
  }, [
    calculateRatingsFromData,
    persistentState.matchHistory,
    currentRatings,
    currentMatchNumber,
  ]);

  const handleVote = useCallback(
    (result) => {
      if (isTransitioning || isError || !currentMatch) {
        return;
      }

      try {
        updateTournamentState({ isTransitioning: true });

        const { voteValue, eloOutcome } = convertVoteToOutcome(result);

        if (!currentMatch?.left?.name || !currentMatch?.right?.name) {
          ErrorManager.handleError(
            new Error("Invalid currentMatch in handleVote"),
            "Tournament Vote",
            {
              isRetryable: false,
              affectsUserData: false,
              isCritical: true,
            },
          );
          return;
        }
        const leftName = currentMatch.left.name;
        const rightName = currentMatch.right.name;
        const leftRating = currentRatings[leftName]?.rating || 1500;
        const rightRating = currentRatings[rightName]?.rating || 1500;

        const leftStats = {
          winsA: currentRatings[leftName]?.wins || 0,
          lossesA: currentRatings[leftName]?.losses || 0,
          winsB: currentRatings[rightName]?.wins || 0,
          lossesB: currentRatings[rightName]?.losses || 0,
        };

        const {
          newRatingA: updatedLeftRating,
          newRatingB: updatedRightRating,
          winsA: newLeftWins,
          lossesA: newLeftLosses,
          winsB: newRightWins,
          lossesB: newRightLosses,
        } = elo.calculateNewRatings(
          leftRating,
          rightRating,
          eloOutcome,
          leftStats,
        );

        // * Add preference to sorter (wrapped in try-catch for safety)
        try {
          if (sorter && typeof sorter.addPreference === "function") {
            sorter.addPreference(leftName, rightName, voteValue);
          } else if (sorter && sorter.preferences instanceof Map) {
            const key = `${leftName}-${rightName}`;
            sorter.preferences.set(key, voteValue);
          }
        } catch (sorterError) {
          // * Log but don't fail the vote if sorter has an issue
          ErrorManager.handleError(
            sorterError,
            "Tournament Vote - Sorter Preference",
            {
              isRetryable: false,
              affectsUserData: false,
              isCritical: false,
            },
          );
          // * Continue with vote processing even if sorter fails
        }

        const voteData = createVoteData({
          result: voteValue,
          matchNumber: currentMatchNumber,
          currentMatch,
          eloOutcome,
          leftRating,
          rightRating,
          updatedLeftRating,
          updatedRightRating,
          userName,
        });

        // * Batch state updates to prevent race conditions
        const newRatings = {
          ...currentRatings,
          [leftName]: {
            ...(currentRatings[leftName] || {}),
            rating: updatedLeftRating,
            wins: newLeftWins,
            losses: newLeftLosses,
          },
          [rightName]: {
            ...(currentRatings[rightName] || {}),
            rating: updatedRightRating,
            wins: newRightWins,
            losses: newRightLosses,
          },
        };

        updatePersistentState((prev) => ({
          ...prev,
          matchHistory: [...prev.matchHistory, voteData],
          currentMatch: currentMatchNumber + 1, // Will be updated to newMatchNumber below
        }));

        tournamentActions.setRatings(newRatings);
        tournamentActions.addVote(voteData);

        // * Prepare updated data including current vote
        const updatedHistory = [...persistentState.matchHistory, voteData];

        // * Calculate new match number (the match we just completed)
        const newMatchNumber = currentMatchNumber + 1;
        updateTournamentState({
          currentMatchNumber: newMatchNumber,
        });

        // * Check if tournament is complete (we've played all expected matches)
        // * newMatchNumber is the match we just completed
        // * For bracket: totalMatches = names.length - 1
        // * If we've completed all matches, finish the tournament
        if (process.env.NODE_ENV === "development") {
          console.log(
            `[Tournament] Match ${newMatchNumber} of ${totalMatches} completed`,
          );
        }

        if (newMatchNumber >= totalMatches) {
          if (process.env.NODE_ENV === "development") {
            console.log(
              `[Tournament] ✅ Tournament complete! Calculating final ratings...`,
            );
          }

          // * Calculate final ratings with updated data (including current vote)
          const finalRatings = calculateRatingsFromData(
            updatedHistory,
            newRatings,
            newMatchNumber, // Use the match number we just completed
          );

          if (process.env.NODE_ENV === "development") {
            console.log(`[Tournament] Final ratings:`, finalRatings);
            console.log(`[Tournament] Calling onComplete...`);
          }

          onComplete(finalRatings);
          return;
        }

        // * Calculate round based on bracket structure
        // * For bracket: matches per round = Math.floor(remainingNames / 2)
        // * Winners advancing = matchesInRound + (remainingNames % 2) [winners + byes]
        // * Handle all cases: 2 names = 1 match (round 1), 3+ names = bracket structure
        if (names.length >= 2) {
          let calculatedRound = 1;

          // * For 2 names, there's only 1 match in round 1
          if (names.length === 2) {
            calculatedRound = 1;
          } else {
            // * Calculate which round we're in based on bracket structure
            // * Round 1: Math.floor(names.length / 2) matches
            // * Each subsequent round: Math.floor(remainingNames / 2) matches
            let remainingNames = names.length;
            let matchesInRound = Math.floor(remainingNames / 2);
            let matchesPlayed = 0;

            // * Use newMatchNumber (the match we just completed) to calculate round
            while (matchesPlayed + matchesInRound < newMatchNumber) {
              matchesPlayed += matchesInRound;
              // * Winners advancing = matches (1 winner each) + byes (if odd number)
              const winners = matchesInRound; // 1 winner per match
              const byes = remainingNames % 2; // Odd names get a bye
              remainingNames = winners + byes; // Total advancing to next round
              matchesInRound = Math.floor(remainingNames / 2);
              calculatedRound++;
            }
          }

          if (calculatedRound !== roundNumber) {
            updateTournamentState({ roundNumber: calculatedRound });
            updatePersistentState({ currentRound: calculatedRound });
          }
        }

        // * Use updated history and ratings including current vote
        const updatedRatings = {
          ...currentRatings,
          [leftName]: {
            ...(currentRatings[leftName] || {}),
            rating: updatedLeftRating,
          },
          [rightName]: {
            ...(currentRatings[rightName] || {}),
            rating: updatedRightRating,
          },
        };

        const nextMatch = getNextMatch(names, sorter, newMatchNumber, {
          currentRatings: updatedRatings,
          history: updatedHistory,
        });

        // * If no more matches available, complete the tournament
        // * This can happen if getNextMatch returns null (no more pairs to compare)
        if (!nextMatch) {
          // * Calculate final ratings with updated data (including current vote)
          const finalRatings = calculateRatingsFromData(
            updatedHistory,
            updatedRatings,
            newMatchNumber, // Use the match number we just completed
          );
          onComplete(finalRatings);
          return;
        }

        updateTournamentState({ currentMatch: nextMatch });

        // * Clear any existing timeout before setting a new one
        if (transitionTimeoutRef.current) {
          clearTimeout(transitionTimeoutRef.current);
        }

        transitionTimeoutRef.current = setTimeout(() => {
          updateTournamentState({ isTransitioning: false });
          transitionTimeoutRef.current = null;
        }, 500);
      } catch (error) {
        // * Clear timeout on error
        if (transitionTimeoutRef.current) {
          clearTimeout(transitionTimeoutRef.current);
          transitionTimeoutRef.current = null;
        }
        ErrorManager.handleError(error, "Tournament Vote Handling", {
          isRetryable: false,
          affectsUserData: false,
          isCritical: true,
        });
        updateTournamentState({
          isError: true,
          isTransitioning: false,
        });
      }
    },
    [
      isTransitioning,
      isError,
      currentMatch,
      currentMatchNumber,
      totalMatches,
      names,
      roundNumber,
      currentRatings,
      sorter,
      onComplete,
      calculateRatingsFromData,
      updateTournamentState,
      updatePersistentState,
      userName,
      elo,
      persistentState.matchHistory,
      tournamentActions,
    ],
  );

  return {
    handleVote,
    getCurrentRatings,
  };
}

function convertVoteToOutcome(result) {
  switch (result) {
    case "left":
      return { voteValue: -1, eloOutcome: "left" };
    case "right":
      return { voteValue: 1, eloOutcome: "right" };
    case "both":
      return {
        voteValue: Math.random() * 0.1 - 0.05,
        eloOutcome: "both",
      };
    case "none":
      return {
        voteValue: Math.random() * 0.06 - 0.03,
        eloOutcome: "none",
      };
    default:
      return { voteValue: 0, eloOutcome: "none" };
  }
}

function createVoteData({
  result,
  matchNumber,
  currentMatch,
  eloOutcome,
  leftRating,
  rightRating,
  updatedLeftRating,
  updatedRightRating,
  userName,
}) {
  return {
    matchNumber,
    result,
    timestamp: Date.now(),
    userName: userName || "anonymous",
    match: {
      left: {
        name: currentMatch?.left?.name || "Unknown",
        description: currentMatch?.left?.description || "",
        won: eloOutcome === "left" || eloOutcome === "both",
      },
      right: {
        name: currentMatch?.right?.name || "Unknown",
        description: currentMatch?.right?.description || "",
        won: eloOutcome === "right" || eloOutcome === "both",
      },
    },
    ratings: {
      before: {
        left: leftRating,
        right: rightRating,
      },
      after: {
        left: updatedLeftRating,
        right: updatedRightRating,
      },
    },
  };
}
