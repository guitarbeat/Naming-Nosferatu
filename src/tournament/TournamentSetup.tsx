import { useMutation } from "@tanstack/react-query";
import {
	AnimatePresence,
	type AnimationPlaybackControls,
	animate,
	motion,
	useMotionValue,
	useReducedMotion,
} from "framer-motion";
import { useEffect, useRef } from "react";
import { ratingsAPI } from "@/api";
import { normalizeRatingsWithStats } from "@/lib/names";
import { fadeMotionPreset } from "@/lib/uiUtils";
import useAppStore, { useTournamentSetupState } from "@/store";
import type { RatingData } from "@/types";
import { NameSelector } from "./NameSelector";
import { TournamentArena } from "./TournamentArena";

export function TournamentSetup() {
	const { names, isComplete, ratings, userId, userName } = useTournamentSetupState();
	const tournamentActions = useAppStore((s) => s.tournamentActions);
	const hasSavedRef = useRef(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const rafThrottleRef = useRef<number | null>(null);
	const prefersReducedMotion = useReducedMotion();
	const scrollY = useMotionValue(0);
	const inertiaControlsRef = useRef<AnimationPlaybackControls | null>(null);
	const lastWheelTsRef = useRef<number>(0);
	const isIntertiaActiveRef = useRef(false);
	const isAutoScrollPausedRef = useRef(false);
	const autoScrollRafRef = useRef<number | null>(null);
	const lastAutoScrollTimeRef = useRef<number>(0);

	const saveRatingsMutation = useMutation({
		mutationFn: ({ userId, ratings }: { userId: string; ratings: Record<string, RatingData> }) =>
			ratingsAPI.saveRatings(userId, ratings),
		onError: (error) => {
			console.error("Tournament ratings save failed — ratings were not persisted", error);
		},
	});

	// Synchronize scrollY motion value with the DOM scroll position and seamless loop boundaries
	useEffect(() => {
		const unsubscribe = scrollY.on("change", (latest) => {
			const el = containerRef.current;
			const threshold = 180;

			if (el && el.scrollHeight > el.clientHeight) {
				const scrollHeight = el.scrollHeight;
				const clientHeight = el.clientHeight;

				// Infinite loop boundary handling during inertia motion
				if (latest + clientHeight >= scrollHeight - threshold) {
					const offset = latest + clientHeight - (scrollHeight - threshold);
					const wrapped = threshold + offset;
					el.scrollTop = wrapped;
					scrollY.set(wrapped);
					return;
				}
				if (latest <= threshold) {
					const wrapped = scrollHeight - (clientHeight + threshold * 2) + latest;
					el.scrollTop = wrapped;
					scrollY.set(wrapped);
					return;
				}

				el.scrollTop = latest;
			} else {
				const docEl = document.documentElement;
				const scrollHeight = docEl.scrollHeight;
				const clientHeight = window.innerHeight;

				if (scrollHeight > clientHeight) {
					if (latest + clientHeight >= scrollHeight - threshold) {
						const offset = latest + clientHeight - (scrollHeight - threshold);
						const wrapped = threshold + offset;
						window.scrollTo({ top: wrapped, behavior: "instant" });
						scrollY.set(wrapped);
						return;
					}
					if (latest <= threshold && latest > 0) {
						const wrapped = scrollHeight - (clientHeight + threshold * 2) + latest;
						window.scrollTo({ top: wrapped, behavior: "instant" });
						scrollY.set(wrapped);
						return;
					}

					window.scrollTo({ top: latest, behavior: "instant" });
				}
			}
		});

		return () => {
			unsubscribe();
			if (inertiaControlsRef.current) {
				inertiaControlsRef.current.stop();
				inertiaControlsRef.current = null;
			}
		};
	}, [scrollY]);

	// Custom inertia-based scroll & passive scroll detection
	useEffect(() => {
		const targetEl = containerRef.current;
		if (!targetEl) {
			return;
		}

		// Initialize scrollY motion value to current scroll
		scrollY.set(targetEl.scrollTop || window.scrollY || 0);

		const handleWheel = (e: WheelEvent) => {
			if (prefersReducedMotion) {
				return;
			}

			// Capture current position and calculate velocity for momentum
			const currentY = scrollY.get();
			const now = performance.now();
			const dt = Math.max(1, Math.min(100, now - (lastWheelTsRef.current || now)));
			lastWheelTsRef.current = now;

			// Stop any ongoing inertia motion
			if (inertiaControlsRef.current) {
				inertiaControlsRef.current.stop();
				inertiaControlsRef.current = null;
			}

			const impulse = e.deltaY;
			const initialVelocity = (impulse / dt) * 45;

			isIntertiaActiveRef.current = true;

			// Launch custom inertia animation using framer-motion
			inertiaControlsRef.current = animate(scrollY, currentY + impulse * 1.5, {
				type: "inertia",
				velocity: initialVelocity,
				power: 0.8,
				timeConstant: 325,
				restDelta: 0.5,
				onComplete: () => {
					isIntertiaActiveRef.current = false;
					inertiaControlsRef.current = null;
				},
			});
		};

		const handleScroll = () => {
			if (rafThrottleRef.current !== null) {
				return;
			}
			rafThrottleRef.current = window.requestAnimationFrame(() => {
				rafThrottleRef.current = null;

				// Sync motion value when scrolling via scrollbar or touch if inertia animation is not active
				if (!isIntertiaActiveRef.current) {
					const currentTop = targetEl.scrollTop || window.scrollY || 0;
					scrollY.set(currentTop);
				}
			});
		};

		const handlePointerMove = (e: PointerEvent) => {
			const target = e.target as HTMLElement | null;
			if (target?.closest?.("[data-tile-id], .drift-wall__tile")) {
				// Pause/damp inertia momentum immediately when hovering over a contender name
				if (inertiaControlsRef.current) {
					inertiaControlsRef.current.stop();
					inertiaControlsRef.current = null;
					isIntertiaActiveRef.current = false;
				}
			}
		};

		const handleKeyDown = (e: KeyboardEvent) => {
			const active = document.activeElement as HTMLElement | null;
			if (
				active &&
				(active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.isContentEditable)
			) {
				return;
			}

			// Stop any ongoing inertia scrolling immediately when navigating with keyboard
			if (inertiaControlsRef.current) {
				inertiaControlsRef.current.stop();
				inertiaControlsRef.current = null;
				isIntertiaActiveRef.current = false;
			}

			const key = e.key;
			if (
				key !== "ArrowUp" &&
				key !== "ArrowDown" &&
				key !== "ArrowLeft" &&
				key !== "ArrowRight" &&
				key !== "Home" &&
				key !== "End" &&
				key !== "PageUp" &&
				key !== "PageDown"
			) {
				return;
			}

			const container = containerRef.current;
			if (!container) {
				return;
			}

			const tiles = Array.from(
				container.querySelectorAll<HTMLElement>(
					'[data-tile-id], .drift-wall__tile, [role="button"]',
				),
			).filter((el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true");

			if (tiles.length === 0) {
				return;
			}

			const activeTileIndex = tiles.findIndex((el) => el === active || el.contains(active));
			let nextTile: HTMLElement | null = null;

			if (activeTileIndex === -1) {
				if (key === "ArrowUp" || key === "End") {
					nextTile = tiles[tiles.length - 1];
				} else {
					nextTile = tiles[0];
				}
			} else {
				const currentTile = tiles[activeTileIndex];
				const currentCol = currentTile.getAttribute("data-col");

				if (currentCol === null) {
					if (key === "ArrowDown") {
						// When at bottom of list, wrap circularly to the top
						const isAtBottom = activeTileIndex >= tiles.length - 1;
						nextTile = isAtBottom ? tiles[0] : tiles[activeTileIndex + 1];
					} else if (key === "ArrowUp") {
						// When at top of list, wrap circularly to the bottom
						const isAtTop = activeTileIndex <= 0;
						nextTile = isAtTop ? tiles[tiles.length - 1] : tiles[activeTileIndex - 1];
					} else if (key === "Home") {
						nextTile = tiles[0];
					} else if (key === "End") {
						nextTile = tiles[tiles.length - 1];
					}
				} else {
					const colTiles = tiles.filter((t) => t.getAttribute("data-col") === currentCol);
					const indexInCol = colTiles.indexOf(currentTile);

					if (key === "ArrowDown") {
						// When hitting the bottom of the column list, shift focus to top
						const isAtBottom = indexInCol >= colTiles.length - 1;
						nextTile = isAtBottom ? colTiles[0] : colTiles[indexInCol + 1];
					} else if (key === "ArrowUp") {
						// When hitting the top of the column list, shift focus to bottom
						const isAtTop = indexInCol <= 0;
						nextTile = isAtTop ? colTiles[colTiles.length - 1] : colTiles[indexInCol - 1];
					} else if (key === "PageDown") {
						const stepIndex = (indexInCol + 4) % colTiles.length;
						nextTile = colTiles[stepIndex];
					} else if (key === "PageUp") {
						const stepIndex = (indexInCol - 4 + colTiles.length) % colTiles.length;
						nextTile = colTiles[stepIndex];
					} else if (key === "Home") {
						nextTile = colTiles[0];
					} else if (key === "End") {
						nextTile = colTiles[colTiles.length - 1];
					} else if (key === "ArrowRight") {
						const allCols = Array.from(
							new Set(tiles.map((t) => Number(t.getAttribute("data-col")))),
						).sort((a, b) => a - b);
						const colNum = Number(currentCol);
						const colIdx = allCols.indexOf(colNum);
						const nextColNum = allCols[(colIdx + 1) % allCols.length];
						const nextColTiles = tiles.filter(
							(t) => Number(t.getAttribute("data-col")) === nextColNum,
						);
						const targetIdx = Math.min(indexInCol, nextColTiles.length - 1);
						nextTile = nextColTiles[targetIdx] || nextColTiles[0];
					} else if (key === "ArrowLeft") {
						const allCols = Array.from(
							new Set(tiles.map((t) => Number(t.getAttribute("data-col")))),
						).sort((a, b) => a - b);
						const colNum = Number(currentCol);
						const colIdx = allCols.indexOf(colNum);
						const prevColNum = allCols[(colIdx - 1 + allCols.length) % allCols.length];
						const prevColTiles = tiles.filter(
							(t) => Number(t.getAttribute("data-col")) === prevColNum,
						);
						const targetIdx = Math.min(indexInCol, prevColTiles.length - 1);
						nextTile = prevColTiles[targetIdx] || prevColTiles[0];
					}
				}
			}

			if (nextTile) {
				e.preventDefault();
				nextTile.focus({ preventScroll: true });

				const rect = nextTile.getBoundingClientRect();
				const containerRect = container.getBoundingClientRect();
				if (rect.top < containerRect.top + 60) {
					const diff = containerRect.top + 80 - rect.top;
					scrollY.set(scrollY.get() - diff);
				} else if (rect.bottom > containerRect.bottom - 60) {
					const diff = rect.bottom - (containerRect.bottom - 80);
					scrollY.set(scrollY.get() + diff);
				}
			}
		};

		const handleMouseEnter = () => {
			isAutoScrollPausedRef.current = true;
		};

		const handleMouseLeave = () => {
			isAutoScrollPausedRef.current = false;
			lastAutoScrollTimeRef.current = performance.now();
		};

		const autoScrollLoop = (time: number) => {
			if (document.hidden) {
				autoScrollRafRef.current = null;
				return;
			}
			const lastTime = lastAutoScrollTimeRef.current || time;
			const dt = Math.min(50, Math.max(1, time - lastTime));
			lastAutoScrollTimeRef.current = time;

			if (!isAutoScrollPausedRef.current && !isIntertiaActiveRef.current) {
				const speed = 0.02;
				const delta = speed * dt;
				scrollY.set(scrollY.get() + delta);
			}

			autoScrollRafRef.current = window.requestAnimationFrame(autoScrollLoop);
		};

		if (!prefersReducedMotion) {
			lastAutoScrollTimeRef.current = performance.now();
			autoScrollRafRef.current = window.requestAnimationFrame(autoScrollLoop);
		}

		const handleVisibilityChange = () => {
			if (document.hidden) {
				if (autoScrollRafRef.current !== null) {
					window.cancelAnimationFrame(autoScrollRafRef.current);
					autoScrollRafRef.current = null;
				}
			} else if (!prefersReducedMotion && autoScrollRafRef.current === null) {
				lastAutoScrollTimeRef.current = performance.now();
				autoScrollRafRef.current = window.requestAnimationFrame(autoScrollLoop);
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);

		targetEl.addEventListener("mouseenter", handleMouseEnter);
		targetEl.addEventListener("mouseleave", handleMouseLeave);
		targetEl.addEventListener("wheel", handleWheel, { passive: true });
		targetEl.addEventListener("scroll", handleScroll, { passive: true });
		targetEl.addEventListener("pointermove", handlePointerMove, { passive: true });
		window.addEventListener("scroll", handleScroll, { passive: true });
		window.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
			targetEl.removeEventListener("mouseenter", handleMouseEnter);
			targetEl.removeEventListener("mouseleave", handleMouseLeave);
			targetEl.removeEventListener("wheel", handleWheel);
			targetEl.removeEventListener("scroll", handleScroll);
			targetEl.removeEventListener("pointermove", handlePointerMove);
			window.removeEventListener("scroll", handleScroll);
			window.removeEventListener("keydown", handleKeyDown);

			if (autoScrollRafRef.current !== null) {
				window.cancelAnimationFrame(autoScrollRafRef.current);
				autoScrollRafRef.current = null;
			}
			if (rafThrottleRef.current !== null) {
				window.cancelAnimationFrame(rafThrottleRef.current);
				rafThrottleRef.current = null;
			}
			if (inertiaControlsRef.current) {
				inertiaControlsRef.current.stop();
				inertiaControlsRef.current = null;
			}
		};
	}, [prefersReducedMotion, scrollY]);

	useEffect(() => {
		if (!isComplete) {
			hasSavedRef.current = false;
			return;
		}
		if (hasSavedRef.current) {
			return;
		}
		if (Object.keys(ratings).length > 0) {
			hasSavedRef.current = true;
			const effectiveUserId = userId || userName || "anonymous";
			const ratingsWithStats = normalizeRatingsWithStats(ratings);
			saveRatingsMutation.mutate({ userId: effectiveUserId, ratings: ratingsWithStats });
		}
	}, [isComplete, ratings, userId, userName, saveRatingsMutation.mutate]);

	return (
		<div ref={containerRef} className="w-full flex flex-col flex-1 min-h-[520px] gap-2">
			<AnimatePresence mode="wait">
				{names && names.length >= 2 ? (
					<motion.div
						key="arena"
						{...fadeMotionPreset}
						className="w-full flex flex-col flex-1 min-h-[520px] py-0"
					>
						<TournamentArena
							names={names}
							onComplete={(completedRatings) => {
								tournamentActions.completeTournament(completedRatings);
							}}
							userName={userName ?? undefined}
						/>
					</motion.div>
				) : (
					<motion.div
						key="setup"
						{...fadeMotionPreset}
						className="w-full flex flex-col flex-1 min-h-[520px] py-0"
					>
						<NameSelector />
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
