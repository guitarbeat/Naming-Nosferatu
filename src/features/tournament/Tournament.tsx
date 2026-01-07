/**
 * @module Tournament
 * @description A React component that handles the tournament-style voting interface for cat names.
 * Provides a UI for comparing two names, with options for liking both or neither.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { STORAGE_KEYS } from "../../core/constants";
import { Error } from "../../shared/components/CommonUI";
import { useToast } from "../../shared/hooks/useAppHooks";
import { getVisibleNames } from "../../shared/utils/core";
import type { TournamentProps } from "../../types/components";
import { FirstMatchTutorial } from "./components/FirstMatchTutorial";
import { TournamentErrorState } from "./components/TournamentErrorState";
import { TournamentLoadingState } from "./components/TournamentLoadingState";
import TournamentMatch from "./components/TournamentMatch/TournamentMatch";
import {
	MatchResult,
	ProgressMilestone,
	RoundTransition,
	TournamentFooter,
	TournamentHeader,
} from "./components/TournamentUI";
import { UndoBanner } from "./components/UndoBanner";
import type { EventListener } from "./hooks/tournamentComponentHooks";
import {
	useAudioManager,
	useKeyboardControls,
	useTournamentState,
	useTournamentVote,
} from "./hooks/tournamentComponentHooks";
import { useBracketTransformation } from "./hooks/useBracketTransformation";
import { useTournamentUIHandlers } from "./hooks/useTournamentUIHandlers";
import { useUndoWindow } from "./hooks/useUndoWindow";
import layoutStyles from "./styles/Layout.module.css";
import TournamentControls from "./TournamentControls";
import { CAT_IMAGES } from "./tournamentUtils";
import { logTournamentRender } from "./utils/debugLogging";

// * Main tournament content component
function TournamentContent({
	onComplete,
	existingRatings = {},
	names = [],
	onVote,
}: TournamentProps) {
	const { showSuccess, showError } = useToast();

	// * Filter out hidden names as a safety measure
	const visibleNames = useMemo(() => getVisibleNames(names), [names]);

	// * Global event listeners ref for proper cleanup
	const globalEventListeners = useRef(new Set<EventListener>());

	// * Custom hooks
	const audioManager = useAudioManager();
	const tournamentState = useTournamentState(visibleNames, existingRatings, onComplete, () => {
		// Intentional no-op: _onVote unused in hook but required by signature
	});

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
		handleUndo,
		progress,
		roundNumber,
		currentMatchNumber,
		totalMatches,
		matchHistory = [],
		getCurrentRatings,
		isError,
	} = tournament;

	// Use the adapted handleVote from tournamentState instead of the raw one from tournament
	const { handleVote } = tournamentState;

	// * Debug logging (development only, throttled)
	logTournamentRender(names?.length || 0, randomizedNames?.length || 0, !!currentMatch);

	// * Undo window - optimized to use CSS animation and single timeout
	const { undoExpiresAt, undoStartTime, canUndoNow, setUndoExpiresAt, clearUndo } = useUndoWindow();

	// * Show cat pictures toggle
	const [showCatPictures, setShowCatPictures] = useState(true);

	// * First match tutorial state
	const [showFirstMatchTutorial, setShowFirstMatchTutorial] = useState(false);

	// * Check if we should show first match tutorial
	useEffect(() => {
		if (typeof window === "undefined" || !currentMatch || currentMatchNumber !== 1) {
			return;
		}

		const userStorage = localStorage.getItem(STORAGE_KEYS.USER_STORAGE);
		const hasSeenTutorial = userStorage
			? JSON.parse(userStorage)?.hasSeenFirstMatchTutorial
			: false;

		if (!hasSeenTutorial) {
			// Show tutorial after a brief delay
			const timer = setTimeout(() => {
				setShowFirstMatchTutorial(true);
			}, 500);
			return () => clearTimeout(timer);
		}
		return; // Explicit return for hasSeenTutorial === true case
	}, [currentMatch, currentMatchNumber]);

	// * Voting hook - encapsulates voting logic, rate limiting, and match result updates
	const { handleVoteWithAnimation } = useTournamentVote({
		isProcessing,
		isTransitioning,
		isError,
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
		setUndoExpiresAt,
		showSuccess,
		showError,
	});

	// * Async wrapper for UI components that expect Promise<void>
	const handleVoteSync = useCallback(
		async (option: string): Promise<void> => {
			// UI components can wait for completion
			await handleVoteWithAnimation(option as "left" | "right" | "both" | "neither");
		},
		[handleVoteWithAnimation],
	);

	// * Handle name card click
	const handleNameCardClick = useCallback(
		(option: "left" | "right") => {
			if (isProcessing || isTransitioning) {
				return;
			}
			setSelectedOption(option);
			// Fire and forget - UI doesn't need to wait for vote completion
			handleVoteWithAnimation(option).catch((error) => {
				console.error("Vote failed:", error);
			});
		},
		// * setState function (setSelectedOption) is stable and doesn't need to be in dependencies
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[
			isProcessing,
			isTransitioning,
			handleVoteWithAnimation, // eslint-disable-next-line @typescript-eslint/no-explicit-any
			setSelectedOption,
		],
	);

	// * Tournament handlers
	const {
		handleEndEarly,
		handleVoteRetry,
		handleDismissError,
		handleToggleBracket,
		handleToggleKeyboardHelp,
		handleToggleCatPictures,
		handleVolumeChange,
	} = useTournamentUIHandlers({
		setIsProcessing,
		setVotingError,
		setShowBracket,
		setShowKeyboardHelp,
		setShowCatPictures,
		getCurrentRatings,
		existingRatings,
		onComplete,
		audioManager,
	});

	// * Keyboard controls
	useKeyboardControls(
		selectedOption,
		isProcessing,
		isTransitioning,
		audioManager.isMuted,
		handleVoteSync,
		globalEventListeners,
		{
			onToggleHelp: handleToggleKeyboardHelp,
			onUndo: () => {
				if (canUndoNow) {
					if (handleUndo) {
						handleUndo();
					}
					clearUndo();
				}
			},
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
			onToggleCatPictures: handleToggleCatPictures,
		},
	);

	// * Transform match history for bracket
	const transformedMatches = useBracketTransformation(matchHistory, visibleNames);

	// * Error state
	if (isError) {
		return <TournamentErrorState />;
	}

	// * Loading state
	if (!visibleNames.length || !randomizedNames.length || !currentMatch) {
		return (
			<TournamentLoadingState
				visibleNamesCount={visibleNames.length}
				randomizedNamesCount={randomizedNames.length}
			/>
		);
	}

	return (
		<div className={layoutStyles.tournament} role="main" aria-live="polite">
			{/* First Match Tutorial */}
			<FirstMatchTutorial
				isOpen={showFirstMatchTutorial}
				onClose={() => setShowFirstMatchTutorial(false)}
			/>

			{/* Noise Background */}

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
				trackInfo={audioManager.trackInfo}
				audioError={audioManager.audioError}
				onRetryAudio={audioManager.retryAudio}
				volume={
					typeof audioManager.volume === "number"
						? { music: audioManager.volume, effects: audioManager.volume }
						: audioManager.volume
				}
				onVolumeChange={handleVolumeChange}
				showCatPictures={showCatPictures}
				onToggleCatPictures={handleToggleCatPictures}
			/>

			{/* Undo banner */}
			<UndoBanner
				undoExpiresAt={undoExpiresAt}
				undoStartTime={undoStartTime}
				onUndo={() => {
					handleUndo();
					clearUndo();
				}}
			/>

			{/* Main Tournament Layout */}
			<div
				className={layoutStyles.tournamentLayout}
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
					onVoteWithAnimation={handleVoteSync}
					onVoteRetry={handleVoteRetry}
					onDismissError={handleDismissError}
					showCatPictures={showCatPictures}
					imageList={CAT_IMAGES}
				/>

				{/* Tournament Footer with Controls, Keyboard Help, and Bracket */}
				<TournamentFooter
					showBracket={showBracket}
					showKeyboardHelp={showKeyboardHelp}
					transformedMatches={transformedMatches}
					onToggleBracket={handleToggleBracket}
					onToggleKeyboardHelp={handleToggleKeyboardHelp}
				/>
			</div>

			{/* Progress Milestone Celebrations */}
			<ProgressMilestone
				progress={progress}
				onDismiss={() => {
					// Milestone auto-dismisses, but handler available for manual dismiss
				}}
			/>

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
function Tournament(props: TournamentProps) {
	return (
		<Error variant="boundary">
			<TournamentContent {...props} />
		</Error>
	);
}

Tournament.displayName = "Tournament";

export default Tournament;
