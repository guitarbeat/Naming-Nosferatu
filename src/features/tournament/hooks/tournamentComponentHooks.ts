/**
 * @module useTournamentState
 * @description Custom hook for managing tournament UI state and interactions.
 * Handles randomized names, selected options, transitions, and UI visibility states.
 */

import {
	type RefObject,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { TOURNAMENT_TIMING } from "../../../core/constants";
import { useTournament } from "../../../core/hooks/tournamentHooks";
import type { NameItem } from "../../../shared/propTypes";
import { shuffleArray } from "../../../shared/utils/core";

/**
 * Custom hook for tournament state management
 * @param {Array} names - Array of names for the tournament
 * @param {Object} existingRatings - Existing ratings for names
 * @param {Function} onComplete - Callback when tournament completes
 * @param {Function} _onVote - Vote callback (unused but kept for API compatibility)
 * @returns {Object} Tournament state and handlers
 */


// ts-prune-ignore-next (used in Tournament)
export function useTournamentState(
	names: NameItem[] | null | undefined,
	existingRatings: Record<string, number> | null | undefined,
	onComplete: (ratings: Record<string, number>) => void,
	_onVote: (winner: NameItem, loser: NameItem) => void,
) {
	const [randomizedNames, setRandomizedNames] = useState<NameItem[]>([]);
	const [selectedOption, setSelectedOption] = useState<
		"left" | "right" | "both" | "neither" | null
	>(null);
	const [isTransitioning, setIsTransitioning] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [lastMatchResult, setLastMatchResult] = useState<string | null>(null);
	const [showMatchResult, setShowMatchResult] = useState<boolean>(false);
	const [showBracket, setShowBracket] = useState<boolean>(false);
	const [showKeyboardHelp, setShowKeyboardHelp] = useState<boolean>(false);
	const [showRoundTransition, setShowRoundTransition] =
		useState<boolean>(false);
	const [nextRoundNumber, setNextRoundNumber] = useState<number | null>(null);
	const [votingError, setVotingError] = useState<unknown>(null);

	const tournamentStateRef = useRef({ isActive: false });

	// * Set up randomized names
	// Shuffle only when the identity set (ids) changes, not on shallow changes
	const namesIdentity = useMemo(
		() =>
			Array.isArray(names) ? names.map((n) => n.id || n.name).join(",") : "",
		[names],
	);
	useEffect(() => {
		if (Array.isArray(names) && names.length > 0) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setRandomizedNames((prev) => {
				const prevIds = Array.isArray(prev)
					? prev.map((n) => n.id || n.name).join(",")
					: "";
				if (prevIds === namesIdentity) return prev; // no reshuffle
				return shuffleArray([...names]);
			});
		}
	}, [names, namesIdentity]);

	// * Tournament hook
	// Convert NameItem[] to Name[] and Record<string, number> to Record<string, { rating: number; wins?: number; losses?: number }>
	const convertedNames: Array<{
		id: string;
		name: string;
		description?: string;
	}> = randomizedNames.map((n) => ({
		id: String(n.id || n.name || ""),
		name: String(n.name || ""),
		description: n.description as string | undefined, // Pass description through
	}));
	const convertedRatings: Record<
		string,
		{ rating: number; wins?: number; losses?: number }
	> = existingRatings
			? Object.fromEntries(
				Object.entries(existingRatings).map(([key, value]) => [
					key,
					typeof value === "number" ? { rating: value } : value,
				]),
			)
			: {};
	const convertedOnComplete = onComplete
		? (
			results: Array<{
				name: string;
				id: string;
				rating: number;
				wins: number;
				losses: number;
			}>,
		) => {
			const ratings = Object.fromEntries(
				results.map((r) => [r.id, r.rating]),
			);
			onComplete(ratings);
		}
		: undefined;

	const tournament = useTournament({
		names: convertedNames,
		existingRatings: convertedRatings,
		onComplete: convertedOnComplete,
	});

	// * Reset state on error
	useEffect(() => {
		if (tournament.isError) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setSelectedOption(null);

			setIsTransitioning(false);

			setIsProcessing(false);
			tournamentStateRef.current.isActive = false;
		}
	}, [tournament.isError]);

	// * Track tournament state
	useEffect(() => {
		if (tournament.currentMatch) {
			tournamentStateRef.current.isActive = true;
		}
	}, [tournament.currentMatch]);

	// * Round transition effect
	useEffect(() => {
		if (tournament.roundNumber > 1) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setShowRoundTransition(true);

			setNextRoundNumber(tournament.roundNumber);

			const timer = setTimeout(() => {
				setShowRoundTransition(false);
				setNextRoundNumber(null);
			}, TOURNAMENT_TIMING.ROUND_TRANSITION_DELAY);

			return () => clearTimeout(timer);
		}
	}, [tournament.roundNumber]);

	return {
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
	};
}

/**
 * @module Tournament/hooks/useTournamentInteractions
 * @description Consolidated tournament interaction hooks for audio, keyboard, magnetic pull, and image gallery
 */

// useTournamentInteractions hooks - uses imports from top of file

// ============================================================================
// Audio Manager Hook
// ============================================================================

/**
 * Lightweight audio manager stub to keep tournament UI stable.
 * Provides the same surface area expected by Tournament.jsx without external assets.
 */
// ts-prune-ignore-next (used in Tournament)
export function useAudioManager() {
	const [isMuted, setIsMuted] = useState(true);
	const [isShuffle, setIsShuffle] = useState(false);
	const [currentTrack, setCurrentTrack] = useState(null);
	const [audioError, setAudioError] = useState(null);
	const [volume, setVolume] = useState(0.2);

	const trackInfo = useMemo(() => {
		if (!currentTrack) return null;
		return { title: currentTrack, artist: "ambient", duration: 0 };
	}, [currentTrack]);

	const playSound = useCallback(() => {
		// Placeholder: wire to real audio if assets are added.
	}, []);

	const handleToggleMute = useCallback(() => {
		setIsMuted((prev) => !prev);
	}, []);

	const handleNextTrack = useCallback(() => {
		// Placeholder: rotate through a playlist when available.
		setCurrentTrack(null);
	}, []);

	const handleToggleShuffle = useCallback(() => {
		setIsShuffle((prev) => !prev);
	}, []);

	const retryAudio = useCallback(() => {
		setAudioError(null);
	}, []);

	const handleVolumeChange = useCallback(
		(_type: "music" | "effects", value: number) => {
			const next = Number.isFinite(value) ? value : volume;
			const clamped = Math.min(1, Math.max(0, next));
			setVolume(clamped);
		},
		[volume],
	);

	return {
		playSound,
		isMuted,
		handleToggleMute,
		handleNextTrack,
		isShuffle,
		handleToggleShuffle,
		currentTrack,
		trackInfo,
		audioError,
		retryAudio,
		volume,
		handleVolumeChange,
	};
}

// ============================================================================
// Keyboard Controls Hook
// ============================================================================

interface KeyboardControlsOptions {
	onSelectLeft?: () => void;
	onSelectRight?: () => void;
	onClearSelection?: () => void;
	onToggleHelp?: () => void;
	onUndo?: () => void;
	onToggleCatPictures?: () => void;
	onToggleMute?: () => void;
}

export interface EventListener {
	event: string;
	handler: (event: Event) => void;
}

/**
 * Keyboard bindings for tournament interactions.
 * Provides lightweight defaults to keep UI responsive without the legacy hook.
 */
// ts-prune-ignore-next (used in Tournament)
export function useKeyboardControls(
	selectedOption: string | null,
	isProcessing: boolean,
	isTransitioning: boolean,
	isMuted: boolean | undefined,
	handleVoteWithAnimation: ((option: string) => void) | undefined,
	globalEventListenersRef: RefObject<Set<EventListener>> | undefined,
	options: KeyboardControlsOptions = {},
) {
	useEffect(() => {
		const handleKeyDown = (e: Event) => {
			const event = e as KeyboardEvent;
			if (isProcessing || isTransitioning) {
				return;
			}

			const { key } = event;

			if (key === "ArrowLeft") {
				options.onSelectLeft?.();
				return;
			}

			if (key === "ArrowRight") {
				options.onSelectRight?.();
				return;
			}

			if (key === "ArrowUp") {
				handleVoteWithAnimation?.("both");
				return;
			}

			if (key === "ArrowDown") {
				handleVoteWithAnimation?.("neither");
				return;
			}

			if (key === "Enter" && selectedOption) {
				handleVoteWithAnimation?.(selectedOption);
				return;
			}

			if (key === "Escape") {
				options.onClearSelection?.();
				return;
			}

			if (key === "h" || key === "H") {
				options.onToggleHelp?.();
				return;
			}

			if (key === "u" || key === "U") {
				options.onUndo?.();
				return;
			}

			if (key === "c" || key === "C") {
				options.onToggleCatPictures?.();
				return;
			}

			if ((key === "m" || key === "M") && typeof isMuted === "boolean") {
				options.onToggleMute?.();
			}
		};

		const listenersSet = globalEventListenersRef?.current;

		window.addEventListener("keydown", handleKeyDown);
		if (listenersSet) {
			listenersSet.add({
				event: "keydown",
				handler: handleKeyDown,
			});
		}

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			if (listenersSet?.delete) {
				listenersSet.forEach((listener) => {
					if (
						listener?.event === "keydown" &&
						listener?.handler === handleKeyDown
					) {
						listenersSet.delete(listener);
					}
				});
			}
		};
	}, [
		globalEventListenersRef,
		handleVoteWithAnimation,
		isMuted,
		isProcessing,
		isTransitioning,
		options,
		selectedOption,
	]);
}

// ============================================================================
// Magnetic Pull Hook
// ============================================================================

/**
 * Hook that applies magnetic pull effect to fighter orbs based on mouse position
 * @param {React.RefObject} leftOrbRef - Ref to the left orb element
 * @param {React.RefObject} rightOrbRef - Ref to the right orb element
 * @param {boolean} enabled - Whether the effect is enabled
 */
export default function useMagneticPull(
	leftOrbRef: React.RefObject<HTMLElement | null>,
	rightOrbRef: React.RefObject<HTMLElement | null>,
	enabled = true,
) {
	const transformRef = useRef<{ left: string | null; right: string | null }>({
		left: null,
		right: null,
	});

	useEffect(() => {
		if (!enabled) return;

		const leftOrb = leftOrbRef.current;
		const rightOrb = rightOrbRef.current;

		if (!leftOrb || !rightOrb) return;

		let animationFrameId: number;
		const mousePos = { x: 0, y: 0 };
		let isDirty = false;

		const updatePosition = () => {
			if (!leftOrb || !rightOrb) return;

			if (isDirty) {
				const xAxis = (window.innerWidth / 2 - mousePos.x) / 40;
				const yAxis = (window.innerHeight / 2 - mousePos.y) / 40;

				// Store transforms for click interaction
				transformRef.current.left = `translate(${-xAxis}px, ${-yAxis}px)`;
				transformRef.current.right = `translate(${xAxis}px, ${yAxis}px)`;

				// Apply transforms
				leftOrb.style.transform = transformRef.current.left;
				rightOrb.style.transform = transformRef.current.right;

				isDirty = false;
			}

			animationFrameId = requestAnimationFrame(updatePosition);
		};

		const handleMouseMove = (e: MouseEvent) => {
			mousePos.x = e.pageX;
			mousePos.y = e.pageY;
			isDirty = true;
		};

		// Start animation loop
		animationFrameId = requestAnimationFrame(updatePosition);

		const handleMouseDown = (orb: HTMLElement | null, isLeft: boolean) => {
			if (!orb) return;
			orb.style.transition = "transform 0.1s ease";
			const currentTransform =
				transformRef.current[isLeft ? "left" : "right"] || "";
			orb.style.transform = `${currentTransform} scale(0.9)`;
		};

		const handleMouseUp = (orb: HTMLElement | null, isLeft: boolean) => {
			if (!orb) return;
			orb.style.transition = "transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)";
			const currentTransform =
				transformRef.current[isLeft ? "left" : "right"] || "";
			orb.style.transform = currentTransform;
		};

		// Add mouse move listener
		document.addEventListener("mousemove", handleMouseMove);

		// Create bound handlers
		const leftMouseDown = () => handleMouseDown(leftOrb, true);
		const leftMouseUp = () => handleMouseUp(leftOrb, true);
		const rightMouseDown = () => handleMouseDown(rightOrb, false);
		const rightMouseUp = () => handleMouseUp(rightOrb, false);

		// Add click interaction
		leftOrb.addEventListener("mousedown", leftMouseDown);
		leftOrb.addEventListener("mouseup", leftMouseUp);
		rightOrb.addEventListener("mousedown", rightMouseDown);
		rightOrb.addEventListener("mouseup", rightMouseUp);

		// Cleanup function
		return () => {
			cancelAnimationFrame(animationFrameId);
			document.removeEventListener("mousemove", handleMouseMove);

			leftOrb.removeEventListener("mousedown", leftMouseDown);
			leftOrb.removeEventListener("mouseup", leftMouseUp);
			rightOrb.removeEventListener("mousedown", rightMouseDown);
			rightOrb.removeEventListener("mouseup", rightMouseUp);

			// Reset transforms
			if (leftOrb) {
				leftOrb.style.transform = "";
				leftOrb.style.transition = "";
			}
			if (rightOrb) {
				rightOrb.style.transform = "";
				rightOrb.style.transition = "";
			}
		};
	}, [leftOrbRef, rightOrbRef, enabled]);
}
