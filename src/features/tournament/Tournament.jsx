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
import { Card, Loading, Error } from "../../shared/components";
import NameCard from "../../shared/components/NameCard/NameCard";
import Bracket from "../../shared/components/Bracket/Bracket";
import TournamentControls from "./TournamentControls";
import MatchResult from "./components/MatchResult/MatchResult";
import RoundTransition from "./components/RoundTransition/RoundTransition";
import { useAudioManager } from "./hooks/useAudioManager";
import { useTournamentState } from "./hooks/useTournamentState";
import { useKeyboardControls } from "./hooks/useKeyboardControls";
import { useToast } from './hooks/useToast';
import { TOURNAMENT_TIMING } from "../../core/constants";
import styles from "./Tournament.module.css";

// * Main tournament content component
function TournamentContent({
  onComplete,
  existingRatings = {},
  names = [],
  onVote,
}) {
  const { showSuccess, showError } = useToast();

  // * Global event listeners ref for proper cleanup
  const globalEventListeners = useRef(new Set());

  // * Custom hooks
  const audioManager = useAudioManager();
  const tournamentState = useTournamentState(
    names,
    existingRatings,
    onComplete,
    onVote
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
  }, [globalEventListeners]);

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
    if (now - lastRenderLogRef.current > TOURNAMENT_TIMING.RENDER_LOG_THROTTLE) {
      console.debug("[DEV] 🎮 Tournament: render", {
        namesCount: names?.length || 0,
        randomizedCount: randomizedNames?.length || 0,
        hasMatch: !!currentMatch,
      });
      lastRenderLogRef.current = now;
    }
  }

  // * Rate limiting for voting
  const lastVoteTimeRef = useRef(0);

  // * Undo window
  const [undoExpiresAt, setUndoExpiresAt] = useState(null);
  const undoRemainingMs = undoExpiresAt
    ? Math.max(0, undoExpiresAt - Date.now())
    : 0;
  const canUndoNow = !!undoExpiresAt && undoRemainingMs > 0;
  useEffect(() => {
    if (!undoExpiresAt) return;
    const id = setInterval(() => {
      if (Date.now() >= undoExpiresAt) {
        setUndoExpiresAt(null);
      } else {
        // trigger re-render
        setUndoExpiresAt((ts) => ts);
      }
    }, TOURNAMENT_TIMING.UNDO_UPDATE_INTERVAL);
    return () => clearInterval(id);
  }, [undoExpiresAt]);

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
      setTimeout(() => setShowMatchResult(true), TOURNAMENT_TIMING.MATCH_RESULT_SHOW_DELAY);
      setTimeout(() => setShowMatchResult(false), TOURNAMENT_TIMING.MATCH_RESULT_HIDE_DELAY);
      showSuccess("Vote recorded successfully!", { duration: TOURNAMENT_TIMING.TOAST_SUCCESS_DURATION });
      // Start undo window
      setUndoExpiresAt(Date.now() + TOURNAMENT_TIMING.UNDO_WINDOW_MS);
    },
    [currentMatch, showSuccess, setLastMatchResult, setShowMatchResult]
  );

  // * Handle vote with animation
  const handleVoteWithAnimation = useCallback(
    async (option) => {
      if (isProcessing || isTransitioning || isError) return;

      // Rate limiting check
      const now = Date.now();
      if (now - lastVoteTimeRef.current < TOURNAMENT_TIMING.VOTE_COOLDOWN) return;
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
                id: currentMatch.left.id,
                description: currentMatch.left.description || "",
                outcome: leftOutcome,
              },
              right: {
                name: rightName,
                id: currentMatch.right.id,
                description: currentMatch.right.description || "",
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
        await new Promise((resolve) => setTimeout(resolve, TOURNAMENT_TIMING.TRANSITION_DELAY_MEDIUM));
        setIsProcessing(false);
        await new Promise((resolve) => setTimeout(resolve, TOURNAMENT_TIMING.TRANSITION_DELAY_SHORT));
        setIsTransitioning(false);
      } catch (error) {
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
      setIsProcessing,
      setIsTransitioning,
      setSelectedOption,
      setVotingError,
    ]
  );

  // * Handle name card click
  const handleNameCardClick = useCallback(
    (option) => {
      if (isProcessing || isTransitioning) return;
      setSelectedOption(option);
      handleVoteWithAnimation(option);
    },
    [isProcessing, isTransitioning, handleVoteWithAnimation, setSelectedOption]
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
  }, [getCurrentRatings, existingRatings, onComplete, setIsProcessing]);

  // * Handle vote retry
  const handleVoteRetry = useCallback(() => {
    setVotingError(null);
  }, [setVotingError]);

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
    }
  );

  // * Transform match history for bracket
  const transformedMatches = useMemo(() => {
    const matchesPerRound = Math.ceil((names?.length || 2) / 2);
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
      const round = Math.max(
        1,
        Math.ceil(matchNumber / Math.max(1, matchesPerRound))
      );

      return {
        id: matchNumber,
        round,
        name1: vote.match.left?.name || "Unknown",
        name2: vote.match.right?.name || "Unknown",
        winner,
      };
    });
  }, [matchHistory, names]);

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
  if (!randomizedNames.length || !currentMatch) {
    return (
      <div className={styles.tournamentContainer}>
        <Loading variant="spinner" />
        <p style={{ textAlign: "center", marginTop: "1rem" }}>
          {!randomizedNames.length
            ? "Setting up tournament..."
            : "Preparing tournament..."}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.tournament} role="main" aria-live="polite">
      {/* Progress Information */}
      <Card
        className={styles.progressInfo}
        background="glass"
        padding="none"
        shadow="medium"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className={styles.roundInfo}>
          <span className={styles.roundNumber}>Round {roundNumber}</span>
          <span className={styles.matchCount}>
            Match {currentMatchNumber} of {totalMatches}
          </span>
        </div>
        <div
          className={styles.percentageInfo}
          aria-label={`Tournament is ${progress}% complete`}
        >
          {progress}% Complete
        </div>
      </Card>

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
      />

      {/* Undo banner */}
      {canUndoNow && (
        <div className={styles.undoBanner} role="status" aria-live="polite">
          <span>
            Vote recorded.
            <span className={styles.undoTimer} aria-hidden="true">
              {` ${Math.max(0, (undoRemainingMs / 1000).toFixed(1))}s`}
            </span>
          </span>
          <button
            className={styles.undoButton}
            onClick={() => {
              handleUndo();
              setUndoExpiresAt(null);
            }}
            aria-label="Undo last vote (Esc)"
          >
            Undo (Esc)
          </button>
        </div>
      )}

      {/* Main Tournament Layout */}
      <div
        className={styles.tournamentLayout}
        role="main"
        aria-label="Tournament voting interface"
      >
        {/* Matchup Section */}
        <Card
          className={styles.matchup}
          background="glass"
          padding="none"
          shadow="medium"
          role="region"
          aria-label="Current matchup"
          aria-busy={isTransitioning || isProcessing}
        >
          <div className={styles.namesRow}>
            <div
              className={`${styles.nameContainer} ${selectedOption === "left" ? styles.selected : ""}`}
              role="group"
              aria-label="Left name option"
            >
              <NameCard
                name={currentMatch.left?.name || "Unknown"}
                description={currentMatch.left?.description || ""}
                onClick={() => handleNameCardClick("left")}
                selected={selectedOption === "left"}
                disabled={isProcessing || isTransitioning}
                shortcutHint="Press ← arrow key"
                size="medium"
              />
            </div>

            <div className={styles.vsSection} aria-hidden="true">
              <span className={styles.vsText}>vs</span>
            </div>

            <div
              className={`${styles.nameContainer} ${selectedOption === "right" ? styles.selected : ""}`}
              role="group"
              aria-label="Right name option"
            >
              <NameCard
                name={currentMatch.right?.name || "Unknown"}
                description={currentMatch.right?.description || ""}
                onClick={() => handleNameCardClick("right")}
                selected={selectedOption === "right"}
                disabled={isProcessing || isTransitioning}
                shortcutHint="Press → arrow key"
                size="medium"
              />
            </div>
          </div>

          {/* Extra Voting Options */}
          <div
            className={styles.extraOptions}
            role="group"
            aria-label="Additional voting options"
          >
            <button
              className={`${styles.extraOptionsButton} ${selectedOption === "both" ? styles.selected : ""}`}
              onClick={() => handleVoteWithAnimation("both")}
              disabled={isProcessing || isTransitioning}
              aria-pressed={selectedOption === "both"}
              aria-label="Vote for both names (Press Up arrow key)"
              type="button"
            >
              I Like Both!{" "}
              <span className={styles.shortcutHint} aria-hidden="true">
                (↑ Up)
              </span>
            </button>

            <button
              className={`${styles.extraOptionsButton} ${selectedOption === "neither" ? styles.selected : ""}`}
              onClick={() => handleVoteWithAnimation("neither")}
              disabled={isProcessing || isTransitioning}
              aria-pressed={selectedOption === "neither"}
              aria-label="Skip this match (Press Down arrow key)"
              type="button"
            >
              Skip{" "}
              <span className={styles.shortcutHint} aria-hidden="true">
                (↓ Down)
              </span>
            </button>
          </div>

          {/* Voting Error Display */}
          {votingError && (
            <Error
              variant="inline"
              error={votingError}
              context="vote"
              position="below"
              onRetry={handleVoteRetry}
              onDismiss={() => setVotingError(null)}
              showRetry={true}
              showDismiss={true}
              size="medium"
              className={styles.votingError}
            />
          )}
        </Card>

        {/* Tournament Controls */}
        <div className={styles.tournamentControls}>
          <button
            className={styles.bracketToggle}
            onClick={() => setShowBracket(!showBracket)}
            aria-expanded={showBracket}
            aria-controls="bracketView"
          >
            {showBracket
              ? "Hide Tournament History"
              : "Show Tournament History"}
            <span className={styles.bracketToggleIcon}>
              {showBracket ? "▼" : "▶"}
            </span>
          </button>

          <button
            className={styles.keyboardHelpToggle}
            onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
            aria-expanded={showKeyboardHelp}
            aria-controls="keyboardHelp"
            type="button"
          >
            <span className={styles.keyboardIcon}>⌨️</span>
            Keyboard Shortcuts
            <span className={styles.keyboardHelpIcon}>
              {showKeyboardHelp ? "▼" : "▶"}
            </span>
          </button>
        </div>

        {/* Keyboard Help */}
        {showKeyboardHelp && (
          <div
            id="keyboardHelp"
            className={styles.keyboardHelp}
            role="complementary"
            aria-label="Keyboard shortcuts help"
          >
            <h3>Keyboard Shortcuts</h3>
            <ul>
              <li>
                <kbd>←</kbd> Select left name
              </li>
              <li>
                <kbd>→</kbd> Select right name
              </li>
              <li>
                <kbd>↑</kbd> Vote for both names
              </li>
              <li>
                <kbd>↓</kbd> Skip this match
              </li>
              <li>
                <kbd>Space</kbd> or <kbd>Enter</kbd> Vote for selected name
              </li>
              <li>
                <kbd>Escape</kbd> Clear selection
              </li>
              <li>
                <kbd>Tab</kbd> Navigate between elements
              </li>
            </ul>
          </div>
        )}

        {/* Bracket View */}
        {showBracket && (
          <div
            id="bracketView"
            className={styles.bracketView}
            role="complementary"
            aria-label="Tournament bracket history"
          >
            <Bracket matches={transformedMatches} />
          </div>
        )}
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
