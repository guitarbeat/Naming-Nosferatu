/**
 * @module Tournament
 * @description A React component that handles the tournament-style voting interface for cat names.
 * Provides a UI for comparing two names, with options for liking both or neither.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TOURNAMENT_TIMING } from "../../core/constants";
import Button from "../../shared/components/Button/Button";
import { Error, Loading } from "../../shared/components/CommonUI";
import { useToast } from "../../shared/hooks/useAppHooks";
import {
	calculateBracketRound,
	getVisibleNames,
} from "../../shared/utils/core";
import type { BracketMatch, NameItem } from "../../types/components";
import TournamentMatch from "./components/TournamentMatch/TournamentMatch";
import {
	MatchResult,
	RoundTransition,
	TournamentFooter,
	TournamentHeader,
} from "./components/TournamentUI";
import type { EventListener } from "./hooks/tournamentComponentHooks";
import {
	useAudioManager,
	useKeyboardControls,
	useTournamentState,
	useTournamentVote,
} from "./hooks/tournamentComponentHooks";
import errorStyles from "./styles/TournamentError.module.css";
import layoutStyles from "./styles/TournamentLayout.module.css";
import undoStyles from "./styles/TournamentUndo.module.css";
// import styles from "./Tournament.module.css"; // Removed
import TournamentControls from "./TournamentControls";
import { CAT_IMAGES } from "./tournamentUtils";

interface VoteData {
	match: {
		left: {
			name: string;
			id: string | number | null;
			description: string;
			outcome: string;
		};
		right: {
			name: string;
			id: string | number | null;
			description: string;
			outcome: string;
		};
	};
	result: number;
	ratings: Record<string, number>;
	timestamp: string;
}

interface TournamentProps {
	names: NameItem[];
	existingRatings?: Record<string, number>;
	onComplete: (ratings: Record<string, number>) => void;

	userName?: string;
	onVote?: (voteData: VoteData) => Promise<void> | void;
}

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
	const tournamentState = useTournamentState(
		visibleNames,
		existingRatings,
		onComplete,
		() => {}, // _onVote unused in hook but required by signature
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

	// * Undo window - optimized to use CSS animation and single timeout
	const [undoExpiresAt, setUndoExpiresAt] = useState<number | null>(null);
	const [undoStartTime, setUndoStartTime] = useState<number | null>(null);
	const canUndoNow = !!undoExpiresAt && !!undoStartTime;

	// * Show cat pictures toggle
	const [showCatPictures, setShowCatPictures] = useState(true);

	useEffect(() => {
		if (!undoExpiresAt) {
			setUndoStartTime(null);
			return;
		}

		// Set start time for CSS animation
		setUndoStartTime(Date.now());

		// Single timeout for logic cleanup
		const timeoutId = setTimeout(() => {
			setUndoExpiresAt(null);
			setUndoStartTime(null);
		}, TOURNAMENT_TIMING.UNDO_WINDOW_MS);

		return () => clearTimeout(timeoutId);
	}, [undoExpiresAt]);

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

	// * Handle name card click
	const handleNameCardClick = useCallback(
		(option: "left" | "right") => {
			if (isProcessing || isTransitioning) return;
			setSelectedOption(option);
			handleVoteWithAnimation(option);
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

	// * Handle end early
	const handleEndEarly = useCallback(async () => {
		try {
			setIsProcessing(true);
			const currentStats = getCurrentRatings?.();
			// Transform array stats to record for onComplete
			const currentRatingsRecord = currentStats?.reduce(
				(acc, item) => {
					acc[String(item.id)] = item.rating;
					return acc;
				},
				{} as Record<string, number>,
			);

			const hasCurrent =
				currentRatingsRecord && Object.keys(currentRatingsRecord).length > 0;
			const fallback =
				existingRatings && Object.keys(existingRatings).length > 0
					? existingRatings
					: {};
			await onComplete(
				hasCurrent && currentRatingsRecord ? currentRatingsRecord : fallback,
			);
		} catch (error) {
			if (process.env.NODE_ENV === "development") {
				console.error("Error ending tournament:", error);
			}
		} finally {
			setIsProcessing(false);
		}
		// * setState function (setIsProcessing) is stable and doesn't need to be in dependencies
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [getCurrentRatings, existingRatings, onComplete, setIsProcessing]);

	// * Handle vote retry
	const handleVoteRetry = useCallback(() => {
		setVotingError(null);
		// * setState function (setVotingError) is stable and doesn't need to be in dependencies
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [setVotingError]);

	// * Memoized handlers to prevent re-renders
	const handleDismissError = useCallback(() => {
		setVotingError(null);
	}, [setVotingError]);

	const handleToggleBracket = useCallback(() => {
		setShowBracket((prev) => !prev);
	}, [setShowBracket]);

	const handleToggleKeyboardHelp = useCallback(() => {
		setShowKeyboardHelp((prev) => !prev);
	}, [setShowKeyboardHelp]);

	const handleToggleCatPictures = useCallback(() => {
		setShowCatPictures((prev) => !prev);
	}, []);

	const handleVolumeChange = useCallback(
		(type: "music" | "effects", value: number) => {
			audioManager.handleVolumeChange(type, value);
		},
		[audioManager],
	);

	// * Keyboard controls
	useKeyboardControls(
		selectedOption,
		isProcessing,
		isTransitioning,
		audioManager.isMuted,
		handleVoteWithAnimation,
		globalEventListeners,
		{
			onToggleHelp: handleToggleKeyboardHelp,
			onUndo: () => {
				if (canUndoNow) {
					if (handleUndo) handleUndo();
					setUndoExpiresAt(null);
					setUndoStartTime(null);
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
	const transformedMatches = useMemo((): BracketMatch[] => {
		if (!visibleNames || visibleNames.length === 0) return [];

		return matchHistory.map((vote, index: number) => {
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

			const bracketMatch: BracketMatch = {
				id: matchNumber,
				round: calculatedRound,
				name1: vote?.match?.left?.name || "Unknown",
				name2: vote?.match?.right?.name || "Unknown",
				winner,
			};
			return bracketMatch;
		});
	}, [matchHistory, visibleNames]);

	// * Error state
	if (isError) {
		return (
			<div className={errorStyles.errorContainer}>
				<h3>Tournament Error</h3>
				<p>There was an error with the tournament. Please try again.</p>
				<button
					onClick={() => window.location.reload()}
					className={errorStyles.retryButton}
				>
					Restart Tournament
				</button>
			</div>
		);
	}

	// * Loading state
	if (!visibleNames.length || !randomizedNames.length || !currentMatch) {
		return (
			<div className={layoutStyles.tournamentContainer}>
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
		<div className={layoutStyles.tournament} role="main" aria-live="polite">
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
			{canUndoNow && undoStartTime && (
				<div className={undoStyles.undoBanner} role="status" aria-live="polite">
					<span>
						Vote recorded.
						<span
							className={undoStyles.undoTimer}
							aria-hidden="true"
							style={{
								animation: `undoProgress ${TOURNAMENT_TIMING.UNDO_WINDOW_MS}ms linear forwards`,
							}}
						>
							{" "}
							{undoExpiresAt && undoStartTime
								? `${((undoExpiresAt - Date.now()) / 1000).toFixed(1)}s`
								: "0.0s"}
						</span>
					</span>
					<Button
						variant="primary"
						size="small"
						onClick={() => {
							handleUndo();
							setUndoExpiresAt(null);
							setUndoStartTime(null);
						}}
						className={undoStyles.undoButton}
						aria-label="Undo last vote (Esc)"
					>
						Undo (Esc)
					</Button>
				</div>
			)}

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
					onVoteWithAnimation={handleVoteWithAnimation}
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
