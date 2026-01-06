/**
 * @module Tournament
 * @description A React component that handles the tournament-style voting interface for cat names.
 * Provides a UI for comparing two names, with options for liking both or neither.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TOURNAMENT_TIMING } from "../../core/constants";
import { Error, Loading } from "../../shared/components/CommonUI";
import { useToast } from "../../shared/hooks/useAppHooks";
import type { NameItem } from "../../shared/propTypes";
import {
	calculateBracketRound,
	getVisibleNames,
} from "../../shared/utils/core";
import TournamentMatch from "./components/TournamentMatch/TournamentMatch";
import {
	MatchResult,
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
} from "./hooks/tournamentComponentHooks";
import styles from "./Tournament.module.css";
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

	// * Rate limiting for voting
	const lastVoteTimeRef = useRef(0);

	// * Undo window
	const [undoExpiresAt, setUndoExpiresAt] = useState<number | null>(null);
	const canUndoNow = !!undoExpiresAt;

	// * Show cat pictures toggle
	const [showCatPictures, setShowCatPictures] = useState(true);

	// * Refs for timeout cleanup
	const matchResultTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

	// * Cleanup match result timers on unmount
	useEffect(() => {
		return () => {
			matchResultTimersRef.current.forEach((timer) => {
				clearTimeout(timer);
			});
			matchResultTimersRef.current = [];
		};
	}, []);

	// * Update match result
	const updateMatchResult = useCallback(
		(option: string) => {
			let resultMessage = "";
			if (option === "both") {
				const leftName =
					typeof currentMatch?.left === "string"
						? currentMatch.left
						: currentMatch?.left?.name || "Unknown";
				const rightName =
					typeof currentMatch?.right === "string"
						? currentMatch.right
						: currentMatch?.right?.name || "Unknown";
				resultMessage = `Both "${leftName}" and "${rightName}" advance!`;
			} else if (option === "left") {
				const leftName =
					typeof currentMatch?.left === "string"
						? currentMatch.left
						: currentMatch?.left?.name || "Unknown";
				resultMessage = `"${leftName}" wins this round!`;
			} else if (option === "right") {
				const rightName =
					typeof currentMatch?.right === "string"
						? currentMatch.right
						: currentMatch?.right?.name || "Unknown";
				resultMessage = `"${rightName}" wins this round!`;
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
			}); // TOAST_SUCCESS_DURATION is undefined in constants? No, assuming it exists.
			// Start undo window
			setUndoExpiresAt(Date.now() + TOURNAMENT_TIMING.UNDO_WINDOW_MS);
		},
		// * setState functions (setUndoExpiresAt, setSelectedOption) are stable and don't need to be in dependencies
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[currentMatch, showSuccess, setLastMatchResult, setShowMatchResult],
	);

	// * Handle vote with animation
	const handleVoteWithAnimation = useCallback(
		async (option: string) => {
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

				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const rawRatings = await handleVote(option as any);

				if (!rawRatings) {
					setIsProcessing(false);
					setIsTransitioning(false);
					return;
				}

				// Transform complex ratings to simple number map if necessary
				const updatedRatings: Record<string, number> = Object.entries(
					rawRatings,
				).reduce(
					(acc, [key, value]) => {
						acc[key] = typeof value === "number" ? value : value.rating;
						return acc;
					},
					{} as Record<string, number>,
				);

				if (onVote && currentMatch) {
					// Helper to safely get properties from NameItem | string
					const getNameData = (item: NameItem | string | undefined) => {
						if (!item) return { name: "Unknown", id: null, description: "" };
						if (typeof item === "string")
							return { name: item, id: item, description: "" };
						return {
							name: item.name || "Unknown",
							id: item.id || null,
							description: item.description || "",
						};
					};

					const leftData = getNameData(currentMatch.left);
					const rightData = getNameData(currentMatch.right);

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

					const voteData: VoteData = {
						match: {
							left: {
								name: leftData.name,
								id: leftData.id,
								description: leftData.description,
								outcome: leftOutcome,
							},
							right: {
								name: rightData.name,
								id: rightData.id,
								description: rightData.description,
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
			setIsProcessing,
			setIsTransitioning,
			setSelectedOption,
			setVotingError,
		],
	);

	// * Handle name card click
	const handleNameCardClick = useCallback(
		(option: string) => {
			if (isProcessing || isTransitioning) return;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			setSelectedOption(option as any);
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
					if (handleUndo) handleUndo();
					setUndoExpiresAt(null);
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
			onToggleCatPictures: () => setShowCatPictures((v) => !v),
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any,
	);

	// * Transform match history for bracket
	const transformedMatches = useMemo(() => {
		if (!visibleNames || visibleNames.length === 0) return [];

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return matchHistory.map((vote: any, index: number) => {
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
				onVolumeChange={(type, value) =>
					audioManager.handleVolumeChange(type, value)
				}
				showCatPictures={showCatPictures}
				onToggleCatPictures={() => setShowCatPictures(!showCatPictures)}
			/>

			{/* Undo banner */}
			{undoExpiresAt && (
				<UndoBanner
					undoExpiresAt={undoExpiresAt}
					onUndo={() => {
						handleUndo();
						setUndoExpiresAt(null);
					}}
					onExpire={() => setUndoExpiresAt(null)}
				/>
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
function Tournament(props: TournamentProps) {
	return (
		<Error variant="boundary">
			<TournamentContent {...props} />
		</Error>
	);
}

Tournament.displayName = "Tournament";

export default Tournament;
