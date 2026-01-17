import { useState } from "react";
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
				onEndEarly={() =>
					onComplete(
						existingRatings as Record<string, { rating: number; wins?: number; losses?: number }>,
					)
				}
				isTransitioning={isTransitioning || isProcessing}
				isMuted={audioManager.isMuted}
				onToggleMute={audioManager.handleToggleMute}
				onNextTrack={audioManager.handleNextTrack}
				volume={{ music: audioManager.volume, effects: audioManager.volume }}
				onVolumeChange={audioManager.handleVolumeChange}
				showCatPictures={showCatPictures}
				onToggleCatPictures={() => setShowCatPictures((p) => !p)}
				isShuffle={false}
				onToggleShuffle={() => {
					/* no-op */
				}}
				trackInfo={null}
				audioError={null}
				onRetryAudio={() => {
					/* no-op */
				}}
			/>
			<UndoBanner
				onUndo={handleUndo}
				undoExpiresAt={Date.now() + 5000}
				undoStartTime={Date.now()}
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
					onToggleBracket={() => setShowBracket((p) => !p)}
					onToggleKeyboardHelp={() => setShowKeyboardHelp((p) => !p)}
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
