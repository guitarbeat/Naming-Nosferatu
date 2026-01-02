/**
 * @module Tournament/hooks/useTournamentInteractions
 * @description Consolidated tournament interaction hooks for audio, keyboard, magnetic pull, and image gallery
 */

import {
	type RefObject,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

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
