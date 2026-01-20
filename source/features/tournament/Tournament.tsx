import { useCallback, useState } from "react";
import { ErrorComponent } from "../../shared/components/ErrorComponent";
import { Loading } from "../../shared/components/Loading";
import { useToast } from "../../shared/hooks/useAppHooks";
import { getVisibleNames } from "../../shared/utils";
import type { BracketMatch, TournamentProps } from "../../types/components";
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

// Defined outside component to maintain referential equality and prevent unnecessary re-renders of TournamentFooter
const EMPTY_MATCHES: BracketMatch[] = [];

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
	} = useTournamentState(visibleNames, existingRatings, onComplete, onVote);

	const {
		currentMatch,
		progress,
		roundNumber,
		currentMatchNumber,
		totalMatches,
		handleUndo,
		canUndo,
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

	// Memoized handlers to prevent unnecessary re-renders of child components (TournamentControls, TournamentFooter, etc.)
	const handleEndEarly = useCallback(
		() =>
			onComplete(
				existingRatings as Record<string, { rating: number; wins?: number; losses?: number }>,
			),
		[onComplete, existingRatings],
	);

	const handleToggleCatPictures = useCallback(() => setShowCatPictures((p) => !p), []);
	const handleToggleBracket = useCallback(() => setShowBracket((p) => !p), [setShowBracket]);
	const handleToggleKeyboardHelp = useCallback(
		() => setShowKeyboardHelp((p) => !p),
		[setShowKeyboardHelp],
	);
	const handleNoOp = useCallback(() => {}, []);
	const handleVoteRetry = useCallback(() => setVotingError(null), [setVotingError]);
	const handleDismissError = useCallback(() => setVotingError(null), [setVotingError]);

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
				volume={{ music: audioManager.volume, effects: audioManager.volume }}
				onVolumeChange={audioManager.handleVolumeChange}
				showCatPictures={showCatPictures}
				onToggleCatPictures={handleToggleCatPictures}
				isShuffle={false}
				onToggleShuffle={handleNoOp}
				trackInfo={null}
				audioError={null}
				onRetryAudio={handleNoOp}
			/>
			{canUndo && <UndoBanner onUndo={handleUndo} />}

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
