import { useCallback } from "react";
import { getNextMatch } from "./useTournamentState";
import { computeRating } from "../../../shared/utils/coreUtils";

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
  const getCurrentRatings = useCallback(() => {
    const countPlayerVotes = (playerName, outcome) => {
      return persistentState.matchHistory.filter((vote) => {
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
        typeof currentRatings[name.name] === "object"
          ? currentRatings[name.name]
          : { rating: currentRatings[name.name] || 1500, wins: 0, losses: 0 };

      const wins = countPlayerVotes(name.name, "win");
      const losses = countPlayerVotes(name.name, "loss");
      const position = wins;

      const finalRating = computeRating(
        existingData.rating,
        position,
        names.length,
        currentMatchNumber,
        totalMatches,
      );

      return {
        name: name.name,
        rating: finalRating,
        wins: existingData.wins + wins,
        losses: existingData.losses + losses,
        confidence: totalMatches > 0 ? currentMatchNumber / totalMatches : 0,
      };
    });
  }, [
    names,
    currentRatings,
    persistentState.matchHistory,
    currentMatchNumber,
    totalMatches,
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
          console.error("Invalid currentMatch in handleVote:", currentMatch);
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

        if (sorter && typeof sorter.addPreference === "function") {
          sorter.addPreference(leftName, rightName, voteValue);
        } else if (sorter && sorter.preferences instanceof Map) {
          const key = `${leftName}-${rightName}`;
          sorter.preferences.set(key, voteValue);
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

        updatePersistentState((prev) => ({
          ...prev,
          matchHistory: [...prev.matchHistory, voteData],
          currentMatch: currentMatchNumber + 1,
        }));

        tournamentActions.setRatings({
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
        });

        tournamentActions.addVote(voteData);

        if (currentMatchNumber >= totalMatches) {
          const finalRatings = getCurrentRatings();
          onComplete(finalRatings);
          return;
        }

        updateTournamentState({
          currentMatchNumber: currentMatchNumber + 1,
        });

        if (names.length > 2) {
          const matchesPerRound = Math.ceil(names.length / 2);
          if (currentMatchNumber % matchesPerRound === 0) {
            const newRound = roundNumber + 1;
            updateTournamentState({ roundNumber: newRound });
            updatePersistentState({ currentRound: newRound });
          }
        }

        const nextMatch = getNextMatch(names, sorter, currentMatchNumber + 1, {
          currentRatings: {
            ...currentRatings,
            [leftName]: {
              ...(currentRatings[leftName] || {}),
              rating: updatedLeftRating,
            },
            [rightName]: {
              ...(currentRatings[rightName] || {}),
              rating: updatedRightRating,
            },
          },
          history: persistentState.matchHistory || [],
        });
        if (nextMatch) {
          updateTournamentState({ currentMatch: nextMatch });
        }

        const timeoutId = setTimeout(() => {
          updateTournamentState({ isTransitioning: false });
        }, 500);

        return () => clearTimeout(timeoutId);
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Vote handling error:", error);
        }
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
      getCurrentRatings,
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
