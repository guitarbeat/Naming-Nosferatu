import { useCallback, useMemo, useState } from "react";
import { ErrorComponent } from "../../shared/components/ErrorComponent";
import { Loading } from "../../shared/components/Loading";
import { useToast } from "../../shared/hooks/useAppHooks";
import { getVisibleNames } from "../../shared/utils";
import type { TournamentProps } from "../../types/components";
import {
  TournamentHeader,
  TournamentMatch,
  TournamentControls,
  TournamentFooter,
} from "./TournamentViews";
import {
  MatchResult,
  RoundTransition,
  UndoBanner,
  KeyboardHelp,
} from "./TournamentOverlays";
import {
  useAudioManager,
  useTournamentState,
  useTournamentVote,
} from "./TournamentHooks";
import { CAT_IMAGES } from "./TournamentLogic";
import styles from "./tournament.module.css";

function TournamentContent({
  onComplete,
  existingRatings = {},
  names = [],
  onVote,
}: TournamentProps) {
  const { showSuccess, showError } = useToast();
  const visibleNames = getVisibleNames(names);

  const audioManager = useAudioManager();
  const {
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
    handleVote,
    tournament,
  } = useTournamentState(
    visibleNames,
    existingRatings,
    onComplete,
    onVote as any,
  );

  const {
    currentMatch,
    progress,
    roundNumber,
    currentMatchNumber,
    totalMatches,
    handleUndo,
  } = tournament;
  const { handleVoteWithAnimation } = useTournamentVote({
    isProcessing,
    isTransitioning,
    currentMatch,
    handleVote,
    onVote,
    audioManager,
    setIsProcessing,
    setIsTransitioning,
    setSelectedOption,
    setVotingError,
    setLastMatchResult,
    setShowMatchResult,
    showSuccess,
    showError,
  });

  const [showCatPictures, setShowCatPictures] = useState(true);

  const handleEndEarly = useCallback(
    () => onComplete(existingRatings as any),
    [onComplete, existingRatings],
  );

  const handleToggleCatPictures = useCallback(
    () => setShowCatPictures((p) => !p),
    [],
  );

  const handleToggleBracket = useCallback(
    () => setShowBracket((p) => !p),
    [setShowBracket],
  );

  const handleToggleKeyboardHelp = useCallback(
    () => setShowKeyboardHelp((p) => !p),
    [setShowKeyboardHelp],
  );

  const volume = useMemo(
    () => ({ music: audioManager.volume, effects: audioManager.volume }),
    [audioManager.volume],
  );

  // Memoize undo timestamps to update only when the match changes,
  // preventing UndoBanner re-renders on other state changes.
  const undoTimestamps = useMemo(
    () => ({
      expires: Date.now() + 5000,
      start: Date.now(),
    }),
    [currentMatch],
  );

  if (!currentMatch)
    return (
      <div className={styles.tournament}>
        <Loading variant="spinner" />
        <p>Preparing tournament...</p>
      </div>
    );

  return (
    <div className={styles.tournament} role="main">
      <TournamentHeader
        roundNumber={roundNumber}
        currentMatchNumber={currentMatchNumber}
        totalMatches={totalMatches}
        progress={progress}
      />
      <TournamentControls
        onEndEarly={handleEndEarly}
        isTransitioning={isTransitioning || isProcessing}
        isMuted={audioManager.isMuted}
        onToggleMute={audioManager.handleToggleMute}
        onNextTrack={audioManager.handleNextTrack}
        volume={volume}
        onVolumeChange={audioManager.handleVolumeChange}
        showCatPictures={showCatPictures}
        onToggleCatPictures={handleToggleCatPictures}
      />
      <UndoBanner
        onUndo={handleUndo}
        undoExpiresAt={undoTimestamps.expires}
        undoStartTime={undoTimestamps.start}
      />

      <div className={styles.tournamentLayout}>
        <TournamentMatch
          currentMatch={currentMatch}
          selectedOption={selectedOption}
          isProcessing={isProcessing}
          isTransitioning={isTransitioning}
          votingError={votingError}
          onNameCardClick={setSelectedOption}
          onVoteWithAnimation={handleVoteWithAnimation}
          onVoteRetry={() => setVotingError(null)}
          onDismissError={() => setVotingError(null)}
          showCatPictures={showCatPictures}
          imageList={CAT_IMAGES}
        />
        <TournamentFooter
          showBracket={showBracket}
          showKeyboardHelp={showKeyboardHelp}
          transformedMatches={[]}
          onToggleBracket={handleToggleBracket}
          onToggleKeyboardHelp={handleToggleKeyboardHelp}
        />
      </div>

      <KeyboardHelp show={showKeyboardHelp} />
      <MatchResult
        showMatchResult={showMatchResult}
        lastMatchResult={lastMatchResult}
      />
      <RoundTransition
        showRoundTransition={showRoundTransition}
        nextRoundNumber={nextRoundNumber}
      />
    </div>
  );
}

export default function Tournament(props: TournamentProps) {
  return (
    <ErrorComponent variant="boundary">
      <TournamentContent {...props} />
    </ErrorComponent>
  );
}
