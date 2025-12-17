/**
 * @module Tournament
 * @description A React component that handles the tournament-style voting interface for cat names.
 * Provides a UI for comparing two names, with options for liking both or neither.
 */

import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import PropTypes from "prop-types";
import { Loading, Error, Button } from "../../shared/components";
import TournamentControls from "./TournamentControls";
import TournamentHeader from "./components/TournamentHeader";
import TournamentMatch from "./components/TournamentMatch";
import TournamentFooter from "./components/TournamentFooter";
import MatchResult from "./components/MatchResult/MatchResult";
import RoundTransition from "./components/RoundTransition/RoundTransition";
import { useAudioManager } from "./hooks/useAudioManager";
import { useTournamentState } from "./hooks/useTournamentState";
import { useKeyboardControls } from "./hooks/useKeyboardControls";
import { useToast } from "../../shared/hooks/useToast";
import { TOURNAMENT_TIMING } from "../../core/constants";
import { CAT_IMAGES } from "./constants";
import { calculateBracketRound } from "../../shared/utils/tournamentUtils";
import { getVisibleNames } from "../../shared/utils/nameFilterUtils";
import styles from "./Tournament.module.css";

// * Main tournament content component
function TournamentContent({
  onComplete,
  existingRatings = {},
  names = [],
  onVote,
}) {
  const { showSuccess, showError } = useToast();

  // * Filter out hidden names as a safety measure
  const visibleNames = useMemo(() => getVisibleNames(names), [names]);

  // * Global event listeners ref for proper cleanup
  const globalEventListeners = useRef(new Set());

  // * Custom hooks
  const audioManager = useAudioManager();
  const tournamentState = useTournamentState(
    visibleNames,
    existingRatings,
    onComplete,
    onVote,
  );

  const {
    randomizedNames,
    selectedOption,
    setSelectedOption,
    isTransitioning,
    setIsTransitioning,
    isProcessing,
    setIsProcessing,
    lastMatchResult,
    setLastMatchResult,
    showMatchResult,
    setShowMatchResult,
    showBracket,
    setShowBracket,
    showKeyboardHelp,
    setShowKeyboardHelp,
    showRoundTransition,
    nextRoundNumber,
    votingError,
    setVotingError,
    tournament,
  } = tournamentState;

  // * Cleanup global event listeners on unmount
  useEffect(() => {
    const currentGlobalEventListeners = globalEventListeners.current;
    return () => {
      currentGlobalEventListeners.forEach(({ event, handler }) => {
        window.removeEventListener(event, handler);
      });
      currentGlobalEventListeners.clear();
    };
    // * Empty deps - refs don't need to be in dependencies
  }, []);

  const {
    currentMatch,
    handleVote,
    handleUndo,
    progress,
    roundNumber,
    currentMatchNumber,
    totalMatches,
    matchHistory = [],
    getCurrentRatings,
    isError,
  } = tournament;

  // * Debug logging (development only, throttled)
  const lastRenderLogRef = useRef(0);
  if (process.env.NODE_ENV === "development") {
    const now = Date.now();
    if (
      now - lastRenderLogRef.current >
      TOURNAMENT_TIMING.RENDER_LOG_THROTTLE
    ) {
      if (process.env.NODE_ENV === "development") {
        console.debug("[DEV] 🎮 Tournament: render", {
          namesCount: names?.length || 0,
          randomizedCount: randomizedNames?.length || 0,
          hasMatch: !!currentMatch,
        });
        lastRenderLogRef.current = now;
      }
    }
  }

  // * Rate limiting for voting
  const lastVoteTimeRef = useRef(0);

  // * Undo window
  const [undoExpiresAt, setUndoExpiresAt] = useState(null);
  const [undoRemainingMs, setUndoRemainingMs] = useState(0);
  const canUndoNow = !!undoExpiresAt && undoRemainingMs > 0;

  // * Show cat pictures toggle
  const [showCatPictures, setShowCatPictures] = useState(true);

  useEffect(() => {
    if (!undoExpiresAt) {
      setUndoRemainingMs(0);
      return;
    }

    // * Update immediately
    const updateRemaining = () => {
      const remaining = Math.max(0, undoExpiresAt - Date.now());
      setUndoRemainingMs(remaining);
      return remaining;
    };

    updateRemaining();

    const id = setInterval(() => {
      const remaining = updateRemaining();
      if (remaining <= 0) {
        setUndoExpiresAt(null);
      }
    }, TOURNAMENT_TIMING.UNDO_UPDATE_INTERVAL);

    return () => clearInterval(id);
  }, [undoExpiresAt]);

  // * Refs for timeout cleanup
  const matchResultTimersRef = useRef([]);

  // * Cleanup match result timers on unmount
  useEffect(() => {
    return () => {
      matchResultTimersRef.current.forEach((timer) => clearTimeout(timer));
      matchResultTimersRef.current = [];
    };
  }, []);

  // * Update match result
  const updateMatchResult = useCallback(
    (option) => {
      let resultMessage = "";
      if (option === "both") {
        resultMessage = `Both "${currentMatch.left?.name || "Unknown"}" and "${currentMatch.right?.name || "Unknown"}" advance!`;
      } else if (option === "left") {
        resultMessage = `"${currentMatch.left?.name || "Unknown"}" wins this round!`;
      } else if (option === "right") {
        resultMessage = `"${currentMatch.right?.name || "Unknown"}" wins this round!`;
      } else if (option === "neither") {
        resultMessage = "Match skipped";
      }

      setLastMatchResult(resultMessage);
      const showTimer = setTimeout(
        () => setShowMatchResult(true),
        TOURNAMENT_TIMING.MATCH_RESULT_SHOW_DELAY,
      );
      const hideTimer = setTimeout(
        () => setShowMatchResult(false),
        TOURNAMENT_TIMING.MATCH_RESULT_HIDE_DELAY,
      );
      matchResultTimersRef.current.push(showTimer, hideTimer);
      showSuccess("Vote recorded successfully!", {
        duration: TOURNAMENT_TIMING.TOAST_SUCCESS_DURATION,
      });
      // Start undo window
      setUndoExpiresAt(Date.now() + TOURNAMENT_TIMING.UNDO_WINDOW_MS);
    },
    // * setState functions (setUndoExpiresAt, setSelectedOption) are stable and don't need to be in dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentMatch, showSuccess],
  );

  // * Handle vote with animation
  const handleVoteWithAnimation = useCallback(
    async (option) => {
      if (isProcessing || isTransitioning || isError) return;

      // Rate limiting check
      const now = Date.now();
      if (now - lastVoteTimeRef.current < TOURNAMENT_TIMING.VOTE_COOLDOWN)
        return;
      lastVoteTimeRef.current = now;

      try {
        setIsProcessing(true);
        setIsTransitioning(true);

        audioManager.playSound();
        updateMatchResult(option);

        const updatedRatings = await handleVote(option);

        if (onVote && currentMatch) {
          const leftName = currentMatch.left?.name || "Unknown";
          const rightName = currentMatch.right?.name || "Unknown";

          let leftOutcome = "skip";
          let rightOutcome = "skip";

          switch (option) {
            case "left":
              leftOutcome = "win";
              rightOutcome = "loss";
              break;
            case "right":
              leftOutcome = "loss";
              rightOutcome = "win";
              break;
            case "both":
              leftOutcome = "win";
              rightOutcome = "win";
              break;
            case "neither":
              break;
          }

          const voteData = {
            match: {
              left: {
                name: leftName,
                id: currentMatch.left?.id || null,
                description: currentMatch.left?.description || "",
                outcome: leftOutcome,
              },
              right: {
                name: rightName,
                id: currentMatch.right?.id || null,
                description: currentMatch.right?.description || "",
                outcome: rightOutcome,
              },
            },
            result:
              option === "left"
                ? -1
                : option === "right"
                  ? 1
                  : option === "both"
                    ? 0.5
                    : 0,
            ratings: updatedRatings,
            timestamp: new Date().toISOString(),
          };

          await onVote(voteData);
        }

        setSelectedOption(null);
        await new Promise((resolve) =>
          setTimeout(resolve, TOURNAMENT_TIMING.TRANSITION_DELAY_MEDIUM),
        );
        setIsProcessing(false);
        await new Promise((resolve) =>
          setTimeout(resolve, TOURNAMENT_TIMING.TRANSITION_DELAY_SHORT),
        );
        setIsTransitioning(false);
      } catch (error) {
        // Reset state on error
        setIsProcessing(false);
        setIsTransitioning(false);
        setSelectedOption(null);
        if (process.env.NODE_ENV === "development") {
          console.error("Error handling vote:", error);
        }
        setVotingError({
          message: "Failed to submit vote. Please try again.",
          severity: "MEDIUM",
          isRetryable: true,
          originalError: error,
        });

        showError("Failed to submit vote. Please try again.", {
          duration: TOURNAMENT_TIMING.TOAST_ERROR_DURATION,
        });
        setIsProcessing(false);
        setIsTransitioning(false);
      }
    },
    // * setState functions (setIsProcessing, setIsTransitioning, setSelectedOption, setVotingError) are stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      isProcessing,
      isTransitioning,
      isError,
      audioManager,
      updateMatchResult,
      handleVote,
      onVote,
      currentMatch,
      showError,
    ],
  );

  // * Handle name card click
  const handleNameCardClick = useCallback(
    (option) => {
      if (isProcessing || isTransitioning) return;
      setSelectedOption(option);
      handleVoteWithAnimation(option);
    },
    // * setState function (setSelectedOption) is stable and doesn't need to be in dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isProcessing, isTransitioning, handleVoteWithAnimation],
  );

  // * Handle end early
  const handleEndEarly = useCallback(async () => {
    try {
      setIsProcessing(true);
      const currentRatings = getCurrentRatings?.();
      const hasCurrent =
        currentRatings && Object.keys(currentRatings).length > 0;
      const fallback =
        existingRatings && Object.keys(existingRatings).length > 0
          ? existingRatings
          : {};
      await onComplete(hasCurrent ? currentRatings : fallback);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error ending tournament:", error);
      }
    } finally {
      setIsProcessing(false);
    }
    // * setState function (setIsProcessing) is stable and doesn't need to be in dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getCurrentRatings, existingRatings, onComplete]);

  // * Handle vote retry
  const handleVoteRetry = useCallback(() => {
    setVotingError(null);
    // * setState function (setVotingError) is stable and doesn't need to be in dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // * Keyboard controls
  useKeyboardControls(
    selectedOption,
    isProcessing,
    isTransitioning,
    audioManager.isMuted,
    handleVoteWithAnimation,
    globalEventListeners,
    {
      onToggleHelp: () => setShowKeyboardHelp((v) => !v),
      onUndo: () => {
        if (canUndoNow) {
          handleUndo();
          setUndoExpiresAt(null);
        }
      },
      canUndoNow,
      onClearSelection: () => setSelectedOption(null),
      onSelectLeft: () => {
        if (!isProcessing && !isTransitioning) {
          setSelectedOption("left");
        }
      },
      onSelectRight: () => {
        if (!isProcessing && !isTransitioning) {
          setSelectedOption("right");
        }
      },
      onToggleCatPictures: () => setShowCatPictures((v) => !v),
    },
  );

  // * Transform match history for bracket
  const transformedMatches = useMemo(() => {
    if (!visibleNames || visibleNames.length === 0) return [];

    return matchHistory.map((vote, index) => {
      // Prefer explicit win flags if available
      const leftWon = vote?.match?.left?.won === true;
      const rightWon = vote?.match?.right?.won === true;
      let winner;
      if (leftWon && rightWon) {
        winner = 0; // both advance
      } else if (leftWon && !rightWon) {
        winner = -1; // left wins
      } else if (!leftWon && rightWon) {
        winner = 1; // right wins
      } else {
        // Fallback to numeric result thresholds
        if (typeof vote.result === "number") {
          if (vote.result < -0.1) winner = -1;
          else if (vote.result > 0.1) winner = 1;
          else if (Math.abs(vote.result) <= 0.1)
            winner = 0; // tie
          else winner = 2; // skipped/other
        } else {
          winner = 2;
        }
      }

      const matchNumber = vote?.matchNumber ?? index + 1;

      // * Calculate round using shared utility function
      const calculatedRound = calculateBracketRound(
        visibleNames.length,
        matchNumber,
      );

      return {
        id: matchNumber,
        round: calculatedRound,
        name1: vote?.match?.left?.name || "Unknown",
        name2: vote?.match?.right?.name || "Unknown",
        winner,
      };
    });
  }, [matchHistory, visibleNames]);

  // * Error state
  if (isError) {
    return (
      <div className={styles.errorContainer}>
        <h3>Tournament Error</h3>
        <p>There was an error with the tournament. Please try again.</p>
        <button
          onClick={() => window.location.reload()}
          className={styles.retryButton}
        >
          Restart Tournament
        </button>
      </div>
    );
  }

  // * Loading state
  if (!visibleNames.length || !randomizedNames.length || !currentMatch) {
    return (
      <div className={styles.tournamentContainer}>
        <Loading variant="spinner" />
        <p style={{ textAlign: "center", marginTop: "1rem" }}>
          {!visibleNames.length
            ? "No visible names available..."
            : !randomizedNames.length
              ? "Setting up tournament..."
              : "Preparing tournament..."}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.tournament} role="main" aria-live="polite">
      {/* Progress Information */}
      <TournamentHeader
        roundNumber={roundNumber}
        currentMatchNumber={currentMatchNumber}
        totalMatches={totalMatches}
        progress={progress}
      />

      {/* Tournament Controls */}
      <TournamentControls
        onEndEarly={handleEndEarly}
        isTransitioning={isTransitioning || isProcessing}
        isMuted={audioManager.isMuted}
        onToggleMute={audioManager.handleToggleMute}
        onNextTrack={audioManager.handleNextTrack}
        isShuffle={audioManager.isShuffle}
        onToggleShuffle={audioManager.handleToggleShuffle}
        currentTrack={audioManager.currentTrack}
        trackInfo={audioManager.trackInfo}
        audioError={audioManager.audioError}
        onRetryAudio={audioManager.retryAudio}
        volume={audioManager.volume}
        onVolumeChange={audioManager.handleVolumeChange}
        showCatPictures={showCatPictures}
        onToggleCatPictures={() => setShowCatPictures(!showCatPictures)}
      />

      {/* Undo banner */}
      {canUndoNow && (
        <div className={styles.undoBanner} role="status" aria-live="polite">
          <span>
            Vote recorded.
            <span className={styles.undoTimer} aria-hidden="true">
              {` ${(undoRemainingMs / 1000).toFixed(1)}s`}
            </span>
          </span>
          <Button
            variant="primary"
            size="small"
            onClick={() => {
              handleUndo();
              setUndoExpiresAt(null);
            }}
            className={styles.undoButton}
            aria-label="Undo last vote (Esc)"
          >
            Undo (Esc)
          </Button>
        </div>
      )}

      {/* Main Tournament Layout */}
      <div
        className={styles.tournamentLayout}
        role="main"
        aria-label="Tournament voting interface"
      >
        {/* Matchup Section */}
        <TournamentMatch
          currentMatch={currentMatch}
          selectedOption={selectedOption}
          isProcessing={isProcessing}
          isTransitioning={isTransitioning}
          votingError={votingError}
          onNameCardClick={handleNameCardClick}
          onVoteWithAnimation={handleVoteWithAnimation}
          onVoteRetry={handleVoteRetry}
          onDismissError={() => setVotingError(null)}
          showCatPictures={showCatPictures}
          imageList={CAT_IMAGES}
        />

        {/* Tournament Footer with Controls, Keyboard Help, and Bracket */}
        <TournamentFooter
          showBracket={showBracket}
          showKeyboardHelp={showKeyboardHelp}
          transformedMatches={transformedMatches}
          onToggleBracket={() => setShowBracket(!showBracket)}
          onToggleKeyboardHelp={() => setShowKeyboardHelp(!showKeyboardHelp)}
        />
      </div>

      {/* Match Result and Round Transition */}
      <MatchResult
        showMatchResult={showMatchResult}
        lastMatchResult={lastMatchResult}
        roundNumber={roundNumber}
        currentMatchNumber={currentMatchNumber}
        totalMatches={totalMatches}
      />
      <RoundTransition
        showRoundTransition={showRoundTransition}
        nextRoundNumber={nextRoundNumber}
      />
    </div>
  );
}

// * Main Tournament component with error boundary
function Tournament(props) {
  return (
    <Error variant="boundary">
      <TournamentContent {...props} />
    </Error>
  );
}

Tournament.displayName = "Tournament";

Tournament.propTypes = {
  names: PropTypes.array,
  existingRatings: PropTypes.object,
  onComplete: PropTypes.func,
  userName: PropTypes.string,
  onVote: PropTypes.func,
};

export default Tournament;
