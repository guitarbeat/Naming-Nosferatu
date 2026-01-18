import { useCallback, useMemo, useState } from "react";
import { ErrorComponent } from "../../shared/components/ErrorComponent";
import { Loading } from "../../shared/components/Loading";
import { useToast } from "../../shared/hooks/useAppHooks";
import { getVisibleNames } from "../../shared/utils";
import type { TournamentProps } from "../../types/components";
import { useAudioManager, useTournamentState, useTournamentVote } from "./TournamentHooks";
import { CAT_IMAGES } from "./TournamentLogic";
import { KeyboardHelp, MatchResult, RoundTransition, UndoBanner } from "./TournamentOverlays";
import {
	TournamentControls,
	TournamentFooter,
	TournamentHeader,
	TournamentMatch,
} from "./TournamentViews";
import styles from "./tournament.module.css";

const EMPTY_MATCHES: any[] = [];

function TournamentContent({
	onComplete,
	existingRatings = {},
	names = [],
	onVote,
}: TournamentProps) {
	const { showSuccess, showError } = useToast();
	const visibleNames = useMemo(() => getVisibleNames(names), [names]);

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
	} = useTournamentState(visibleNames, existingRatings, onComplete, onVote);

	const { currentMatch, progress, roundNumber, currentMatchNumber, totalMatches, handleUndo } =
		tournament;
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

	const handleEndEarly = useCallback(() => {
		onComplete(
			existingRatings as Record<string, { rating: number; wins?: number; losses?: number }>,
		);
	}, [onComplete, existingRatings]);

	const handleToggleCatPictures = useCallback(() => setShowCatPictures((p) => !p), []);
	const handleToggleShuffle = useCallback(() => {
		/* no-op */
	}, []);
	const handleRetryAudio = useCallback(() => {
		/* no-op */
	}, []);
	const handleVoteRetry = useCallback(() => setVotingError(null), [setVotingError]);
	const handleDismissError = useCallback(() => setVotingError(null), [setVotingError]);
	const handleToggleBracket = useCallback(() => setShowBracket((p) => !p), [setShowBracket]);
	const handleToggleKeyboardHelp = useCallback(
		() => setShowKeyboardHelp((p) => !p),
		[setShowKeyboardHelp],
	);

	const lastMatchTimestamp = useMemo(() => {
		if (tournament.matchHistory && tournament.matchHistory.length > 0) {
			const last = tournament.matchHistory[tournament.matchHistory.length - 1];
			// timestamp is optional or might be number/string depending on impl, checking hook
			// In hook: timestamp: Date.now()
			return last.timestamp ? Number(last.timestamp) : 0;
		}
		return 0;
	}, [tournament.matchHistory]);

	const volumeSettings = useMemo(
		() => ({ music: audioManager.volume, effects: audioManager.volume }),
		[audioManager.volume],
	);

	if (!currentMatch) {
		return (
			<div className={styles.tournament}>
				<Loading variant="spinner" />
				<p>Preparing tournament...</p>
			</div>
		);
	}

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
				volume={volumeSettings}
				onVolumeChange={audioManager.handleVolumeChange}
				showCatPictures={showCatPictures}
				onToggleCatPictures={handleToggleCatPictures}
				isShuffle={false}
				onToggleShuffle={handleToggleShuffle}
				trackInfo={null}
				audioError={null}
				onRetryAudio={handleRetryAudio}
			/>
			<UndoBanner
				onUndo={handleUndo}
				undoExpiresAt={lastMatchTimestamp ? lastMatchTimestamp + 5000 : 0}
				undoStartTime={lastMatchTimestamp}
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
					onVoteRetry={handleVoteRetry}
					onDismissError={handleDismissError}
					showCatPictures={showCatPictures}
					imageList={CAT_IMAGES}
				/>
				<TournamentFooter
					showBracket={showBracket}
					showKeyboardHelp={showKeyboardHelp}
					transformedMatches={EMPTY_MATCHES}
					onToggleBracket={handleToggleBracket}
					onToggleKeyboardHelp={handleToggleKeyboardHelp}
				/>
			</div>

			<KeyboardHelp show={showKeyboardHelp} />
			<MatchResult showMatchResult={showMatchResult} lastMatchResult={lastMatchResult} />
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
